import mongoose from "mongoose";
import Campaign from "./campaign.model.js";
import CampaignProduct from "./campaignProduct.model.js";
import CampaignPurchase from "./campaignPurchase.model.js";
import { OrderItem } from "../orders/order.model.js";
import Product from "../products/product.model.js";
import pricingService from "./pricing.service.js";
import { AppError } from "../../common/exceptions/AppError.js";

class CampaignService {
  /**
   * Public: Lấy danh sách chiến dịch đang active kèm thời gian đếm ngược (server time)
   */
  async getActiveCampaigns() {
    const now = new Date();
    const bundle = await pricingService.getActiveCampaignsBundle(now);
    const { campaigns = [], campaignProducts = [] } = bundle;

    // Lấy thông tin sản phẩm mẫu hiển thị cho mỗi chiến dịch
    const enrichedCampaigns = await Promise.all(
      campaigns.map(async (camp) => {
        const campProducts = campaignProducts.filter(
          (cp) => String(cp.campaign_id) === String(camp._id)
        );

        // Lấy danh sách product IDs
        const productIds = [...new Set(campProducts.map((cp) => cp.product_id))];
        const dbProducts = await Product.find({
          _id: { $in: productIds },
          is_active: true,
        })
          .select("name slug image displayProduct new_price price rating sold")
          .lean();

        const productMap = new Map(dbProducts.map((p) => [String(p._id), p]));

        const items = campProducts
          .map((cp) => {
            const prod = productMap.get(String(cp.product_id));
            if (!prod) return null;
            const originalPrice = Number(prod.new_price ?? prod.price ?? 0);
            const remainingQuota = Math.max(0, cp.quota - (cp.sold || 0));
            return {
              product_id: cp.product_id,
              variant_id: cp.variant_id,
              name: prod.name,
              slug: prod.slug,
              image: prod.image || prod.displayProduct?.[0] || null,
              original_price: originalPrice,
              sale_price: cp.sale_price,
              quota: cp.quota,
              sold: cp.sold || 0,
              remainingQuota,
              discountPercentage:
                originalPrice > cp.sale_price
                  ? Math.round(((originalPrice - cp.sale_price) / originalPrice) * 100)
                  : 0,
            };
          })
          .filter(Boolean);

        const endMs = new Date(camp.endAt).getTime();
        const nowMs = now.getTime();
        const durationSeconds = Math.max(0, Math.floor((endMs - nowMs) / 1000));

        return {
          _id: camp._id,
          name: camp.name,
          slug: camp.slug,
          type: camp.type,
          status: camp.status,
          startAt: camp.startAt,
          endAt: camp.endAt,
          priority: camp.priority,
          bannerId: camp.bannerId,
          pageId: camp.pageId,
          discountRule: camp.discountRule,
          remainingSeconds: durationSeconds,
          products: items,
        };
      })
    );

    return {
      serverTime: now.toISOString(),
      campaigns: enrichedCampaigns,
    };
  }

  /**
   * Public: Lấy chi tiết chiến dịch theo slug kèm danh sách sản phẩm phân trang
   */
  async getCampaignBySlug(slug, query = {}) {
    const { page = 1, limit = 12 } = query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const campaign = await Campaign.findOne({
      slug,
      isDeleted: false,
    }).lean();

    if (!campaign) {
      throw new AppError("Chiến dịch không tồn tại hoặc đã bị gỡ", 404);
    }

    const now = new Date();
    const endMs = new Date(campaign.endAt).getTime();
    const nowMs = now.getTime();
    const remainingSeconds = Math.max(0, Math.floor((endMs - nowMs) / 1000));

    let products = [];
    let totalProducts = 0;

    if (campaign.type === "flash_sale" || campaign.discountRule?.scope === "products") {
      // Đọc từ CampaignProduct
      const filter = { campaign_id: campaign._id };
      totalProducts = await CampaignProduct.countDocuments(filter);

      const cpList = await CampaignProduct.find(filter)
        .skip(skip)
        .limit(limitNum)
        .populate("product_id")
        .populate("variant_id")
        .lean();

      products = cpList
        .map((cp) => {
          const prod = cp.product_id;
          if (!prod) return null;
          const originalPrice = Number(prod.new_price ?? prod.price ?? 0);
          const remainingQuota = Math.max(0, cp.quota - (cp.sold || 0));
          return {
            _id: prod._id,
            id: prod._id.toString(),
            name: prod.name,
            slug: prod.slug,
            image: prod.image || prod.displayProduct?.[0] || null,
            displayProduct: prod.displayProduct || [],
            price: cp.sale_price,
            sale_price: cp.sale_price,
            original_price: originalPrice,
            old_price: originalPrice,
            oldPrice: originalPrice,
            quota: cp.quota,
            sold: cp.sold || 0,
            remainingQuota,
            discountPercentage:
              originalPrice > cp.sale_price
                ? Math.round(((originalPrice - cp.sale_price) / originalPrice) * 100)
                : 0,
            campaign: {
              id: campaign._id,
              name: campaign.name,
              type: campaign.type,
              remainingQuota,
              discountPercentage:
                originalPrice > cp.sale_price
                  ? Math.round(((originalPrice - cp.sale_price) / originalPrice) * 100)
                  : 0,
            },
          };
        })
        .filter(Boolean);
    } else {
      // Seasonal scope: all | categories
      const prodFilter = { is_active: true };
      if (campaign.discountRule?.scope === "categories") {
        prodFilter.category_id = { $in: campaign.discountRule.categoryIds || [] };
      }

      totalProducts = await Product.countDocuments(prodFilter);
      const rawProducts = await Product.find(prodFilter)
        .skip(skip)
        .limit(limitNum)
        .populate("category_id", "name")
        .lean();

      products = await Promise.all(
        rawProducts.map(async (prod) => {
          const resolved = await pricingService.resolvePrice(prod, null, now);
          return {
            _id: prod._id,
            id: prod._id.toString(),
            name: prod.name,
            slug: prod.slug,
            image: prod.image || prod.displayProduct?.[0] || null,
            displayProduct: prod.displayProduct || [],
            price: resolved.finalPrice,
            sale_price: resolved.finalPrice,
            original_price: resolved.originalPrice,
            old_price: resolved.isSale ? resolved.originalPrice : (prod.old_price ?? prod.oldPrice ?? 0),
            oldPrice: resolved.isSale ? resolved.originalPrice : (prod.old_price ?? prod.oldPrice ?? 0),
            discountPercentage: resolved.discountPercentage,
            category: prod.category_id?.name || "Thời trang",
            campaign: resolved.campaignId
              ? {
                  id: resolved.campaignId,
                  name: resolved.campaignName,
                  type: resolved.type,
                  discountPercentage: resolved.discountPercentage,
                }
              : null,
          };
        })
      );
    }

    return {
      serverTime: now.toISOString(),
      campaign: {
        ...campaign,
        remainingSeconds,
      },
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalProducts,
        totalPages: Math.ceil(totalProducts / limitNum),
      },
    };
  }

  /**
   * Admin: Danh sách chiến dịch
   */
  async getAdminCampaigns(query = {}) {
    const { page = 1, limit = 10, search = "", status = "", type = "" } = query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = { isDeleted: false };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }
    if (status) filter.status = status;
    if (type) filter.type = type;

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .lean(),
      Campaign.countDocuments(filter),
    ]);

    return {
      campaigns,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Admin: Chi tiết chiến dịch kèm thống kê (đã bán, doanh thu, suất còn lại)
   */
  async getAdminCampaignDetail(id) {
    const campaign = await Campaign.findOne({ _id: id, isDeleted: false })
      .populate("bannerId")
      .populate("discountRule.categoryIds", "name")
      .lean();

    if (!campaign) {
      throw new AppError("Chiến dịch không tồn tại", 404);
    }

    // Danh sách campaign products
    const products = await CampaignProduct.find({ campaign_id: id })
      .populate("product_id")
      .populate("variant_id")
      .lean();

    // Thống kê doanh thu và đơn hàng từ OrderItem
    const salesStats = await OrderItem.aggregate([
      {
        $match: {
          campaign_id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $group: {
          _id: null,
          totalItemsSold: { $sum: "$quantity" },
          totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } },
          orderCount: { $addToSet: "$order_id" },
        },
      },
      {
        $project: {
          _id: 0,
          totalItemsSold: 1,
          totalRevenue: 1,
          totalOrders: { $size: "$orderCount" },
        },
      },
    ]);

    const stats = salesStats[0] || {
      totalItemsSold: 0,
      totalRevenue: 0,
      totalOrders: 0,
    };

    const totalQuota = products.reduce((sum, p) => sum + (p.quota || 0), 0);
    const totalSoldFromProducts = products.reduce((sum, p) => sum + (p.sold || 0), 0);

    return {
      campaign,
      products,
      stats: {
        ...stats,
        totalQuota,
        totalSold: Math.max(stats.totalItemsSold, totalSoldFromProducts),
        totalRemainingQuota: Math.max(0, totalQuota - totalSoldFromProducts),
      },
    };
  }

  /**
   * Admin: Tạo chiến dịch
   */
  async createCampaign(userId, data) {
    const existing = await Campaign.findOne({ slug: data.slug, isDeleted: false });
    if (existing) {
      throw new AppError("Slug chiến dịch đã tồn tại, vui lòng chọn slug khác", 400);
    }

    if (new Date(data.endAt) <= new Date(data.startAt)) {
      throw new AppError("Thời gian kết thúc phải lớn hơn thời gian bắt đầu", 400);
    }

    const campaign = await Campaign.create({
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });

    await pricingService.invalidateActiveCampaignsCache();
    return campaign;
  }

  /**
   * Admin: Sửa chiến dịch
   */
  async updateCampaign(userId, id, data) {
    const campaign = await Campaign.findOne({ _id: id, isDeleted: false });
    if (!campaign) {
      throw new AppError("Chiến dịch không tồn tại", 404);
    }

    // Kiểm tra ràng buộc khi chiến dịch đang active và đã có đơn hàng
    if (campaign.status === "active") {
      const hasOrders = await OrderItem.exists({ campaign_id: id });
      if (hasOrders) {
        // Không cho sửa sale_price, quota (ngoại trừ tăng), thời gian
        if (data.startAt && new Date(data.startAt).getTime() !== new Date(campaign.startAt).getTime()) {
          throw new AppError("Chiến dịch đang active và đã phát sinh đơn hàng: Không được đổi thời gian bắt đầu", 400);
        }
        if (data.endAt && new Date(data.endAt).getTime() < new Date(campaign.endAt).getTime()) {
          throw new AppError("Chiến dịch đang active và đã phát sinh đơn hàng: Không được rút ngắn thời gian kết thúc", 400);
        }
        if (data.type && data.type !== campaign.type) {
          throw new AppError("Chiến dịch đang active và đã phát sinh đơn hàng: Không được đổi loại chiến dịch", 400);
        }
        if (data.discountRule) {
          throw new AppError("Chiến dịch đang active và đã phát sinh đơn hàng: Không được thay đổi quy tắc giảm giá", 400);
        }
      }
    }

    Object.assign(campaign, data, { updatedBy: userId });
    await campaign.save();

    await pricingService.invalidateActiveCampaignsCache();
    return campaign;
  }

  /**
   * Admin: Xóa chiến dịch (Chống xóa cứng nếu đã có đơn hàng)
   */
  async deleteCampaign(userId, id) {
    const campaign = await Campaign.findOne({ _id: id, isDeleted: false });
    if (!campaign) {
      throw new AppError("Chiến dịch không tồn tại", 404);
    }

    // Luôn soft-delete để bảo toàn lịch sử đơn hàng
    campaign.isDeleted = true;
    campaign.updatedBy = userId;
    await campaign.save();

    await pricingService.invalidateActiveCampaignsCache();
    return { success: true, message: "Đã xóa chiến dịch thành công" };
  }

  /**
   * Admin: Thêm sản phẩm vào chiến dịch
   */
  async addCampaignProduct(userId, campaignId, productData) {
    const campaign = await Campaign.findOne({ _id: campaignId, isDeleted: false });
    if (!campaign) {
      throw new AppError("Chiến dịch không tồn tại", 404);
    }

    const { product_id, variant_id = null, sale_price, quota, per_user_limit = null } = productData;

    const product = await Product.findById(product_id);
    if (!product) {
      throw new AppError("Sản phẩm không tồn tại", 404);
    }

    const originalPrice = Number(product.new_price ?? product.price ?? 0);
    if (sale_price >= originalPrice) {
      throw new AppError(
        `Giá khuyến mãi (${sale_price.toLocaleString("vi-VN")}đ) phải nhỏ hơn giá gốc hiện tại (${originalPrice.toLocaleString("vi-VN")}đ)`,
        400
      );
    }

    // Kiểm tra trùng cấu hình
    const existing = await CampaignProduct.findOne({
      campaign_id: campaignId,
      product_id,
      variant_id: variant_id || null,
    });
    if (existing) {
      throw new AppError("Sản phẩm / Biến thể này đã có trong chiến dịch", 400);
    }

    const created = await CampaignProduct.create({
      campaign_id: campaignId,
      product_id,
      variant_id: variant_id || null,
      sale_price,
      quota,
      sold: 0,
      per_user_limit,
    });

    await pricingService.invalidateActiveCampaignsCache();
    return created;
  }

  /**
   * Admin: Cập nhật cấu hình sản phẩm trong chiến dịch
   */
  async updateCampaignProduct(userId, campaignId, productId, updateData) {
    const campaign = await Campaign.findOne({ _id: campaignId, isDeleted: false });
    if (!campaign) {
      throw new AppError("Chiến dịch không tồn tại", 404);
    }

    const cp = await CampaignProduct.findOne({
      campaign_id: campaignId,
      product_id: productId,
    });
    if (!cp) {
      throw new AppError("Sản phẩm không thuộc chiến dịch này", 404);
    }

    // Nếu chiến dịch đang active và đã có đơn hàng
    if (campaign.status === "active") {
      const hasPurchases = (cp.sold || 0) > 0;
      if (hasPurchases) {
        if (updateData.sale_price !== undefined && updateData.sale_price !== cp.sale_price) {
          throw new AppError(
            "Chiến dịch đang diễn ra và đã có đơn hàng: Không thể sửa giá sale_price",
            400
          );
        }
        if (updateData.quota !== undefined && updateData.quota < cp.quota) {
          throw new AppError(
            `Chiến dịch đang diễn ra và đã có đơn hàng: Chỉ được phép tăng quota (hiện tại: ${cp.quota}), không được giảm quota`,
            400
          );
        }
      }
    }

    if (updateData.sale_price !== undefined) {
      const product = await Product.findById(productId);
      const originalPrice = Number(product?.new_price ?? product?.price ?? 0);
      if (updateData.sale_price >= originalPrice) {
        throw new AppError(
          `Giá ưu đãi (${updateData.sale_price.toLocaleString("vi-VN")}đ) phải nhỏ hơn giá gốc (${originalPrice.toLocaleString("vi-VN")}đ)`,
          400
        );
      }
      cp.sale_price = updateData.sale_price;
    }

    if (updateData.quota !== undefined) {
      if (updateData.quota < (cp.sold || 0)) {
        throw new AppError(
          `Quota mới (${updateData.quota}) không thể nhỏ hơn số lượng đã bán (${cp.sold})`,
          400
        );
      }
      cp.quota = updateData.quota;
    }

    if (updateData.per_user_limit !== undefined) {
      cp.per_user_limit = updateData.per_user_limit;
    }

    await cp.save();
    await pricingService.invalidateActiveCampaignsCache();
    return cp;
  }

  /**
   * Admin: Xóa sản phẩm khỏi chiến dịch
   */
  async removeCampaignProduct(userId, campaignId, productId) {
    const cp = await CampaignProduct.findOne({
      campaign_id: campaignId,
      product_id: productId,
    });
    if (!cp) {
      throw new AppError("Sản phẩm không có trong chiến dịch", 404);
    }

    if ((cp.sold || 0) > 0) {
      throw new AppError(
        "Sản phẩm đã phát sinh lượt mua trong chiến dịch, không thể xóa khỏi chương trình",
        400
      );
    }

    await CampaignProduct.deleteOne({ _id: cp._id });
    await pricingService.invalidateActiveCampaignsCache();
    return { success: true, message: "Đã xóa sản phẩm khỏi chiến dịch" };
  }
}

export default new CampaignService();

