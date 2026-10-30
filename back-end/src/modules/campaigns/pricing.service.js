import mongoose from "mongoose";
import Campaign from "./campaign.model.js";
import CampaignProduct from "./campaignProduct.model.js";
import getRedisConnection from "../../configs/redis.js";
import { CAMPAIGN_CACHE_KEY, CAMPAIGN_CACHE_TTL } from "./campaign.constants.js";

class PricingService {
  /**
   * Xóa cache danh sách chiến dịch đang active (gọi khi Admin thêm/sửa/xóa hoặc Cron chuyển trạng thái)
   */
  async invalidateActiveCampaignsCache() {
    try {
      const redis = getRedisConnection();
      if (redis) {
        await redis.del(CAMPAIGN_CACHE_KEY);
      }
    } catch (err) {
      console.warn("[PricingService] Lỗi khi xóa cache chiến dịch:", err.message);
    }
  }

  /**
   * Lấy gói dữ liệu chiến dịch active và danh sách sản phẩm ưu đãi liên quan (có cache Redis 30-60 giây)
   */
  async getActiveCampaignsBundle(now = new Date()) {
    const redis = getRedisConnection();
    if (redis) {
      try {
        const cached = await redis.get(CAMPAIGN_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Parse lại Date objects
          parsed.campaigns = parsed.campaigns.map((c) => ({
            ...c,
            startAt: new Date(c.startAt),
            endAt: new Date(c.endAt),
          }));
          return parsed;
        }
      } catch (err) {
        console.warn("[PricingService] Lỗi đọc Redis cache campaigns:", err.message);
      }
    }

    const queryTime = now instanceof Date ? now : new Date(now);

    // Tìm các chiến dịch đang trong khung giờ
    const campaigns = await Campaign.find({
      isDeleted: false,
      status: { $in: ["active", "scheduled"] },
      startAt: { $lte: queryTime },
      endAt: { $gte: queryTime },
    })
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    if (!campaigns || campaigns.length === 0) {
      const emptyBundle = { campaigns: [], campaignProducts: [] };
      if (redis) {
        try {
          await redis.set(CAMPAIGN_CACHE_KEY, JSON.stringify(emptyBundle), "EX", CAMPAIGN_CACHE_TTL);
        } catch (_) {}
      }
      return emptyBundle;
    }

    const campaignIds = campaigns.map((c) => c._id);
    const campaignProducts = await CampaignProduct.find({
      campaign_id: { $in: campaignIds },
    }).lean();

    const bundle = {
      campaigns,
      campaignProducts,
    };

    if (redis) {
      try {
        await redis.set(CAMPAIGN_CACHE_KEY, JSON.stringify(bundle), "EX", CAMPAIGN_CACHE_TTL);
      } catch (err) {
        console.warn("[PricingService] Lỗi ghi Redis cache campaigns:", err.message);
      }
    }

    return bundle;
  }

  /**
   * Nguồn sự thật duy nhất tính giá cho 1 sản phẩm / biến thể
   * @param {Object} product - Product doc hoặc object
   * @param {Object|string|null} variant - Variant doc hoặc variantId
   * @param {Date} now - Thời điểm tính giá
   * @param {string|null} userId - ID người mua (nếu có để xét per_user_limit)
   * @param {Object|null} bundle - Pre-fetched active campaigns bundle (tránh N+1)
   */
  async resolvePrice(product, variant = null, now = new Date(), userId = null, bundle = null) {
    if (!product) {
      return {
        finalPrice: 0,
        originalPrice: 0,
        campaignId: null,
        campaignName: null,
        type: null,
        remainingQuota: null,
        discountPercentage: 0,
      };
    }

    const originalPrice = Number(product.new_price ?? product.price ?? 0);
    if (originalPrice <= 0) {
      return {
        finalPrice: 0,
        originalPrice: 0,
        campaignId: null,
        campaignName: null,
        type: null,
        remainingQuota: null,
        discountPercentage: 0,
      };
    }

    const activeBundle = bundle || (await this.getActiveCampaignsBundle(now));
    const { campaigns = [], campaignProducts = [] } = activeBundle;

    if (!campaigns.length) {
      return {
        finalPrice: originalPrice,
        originalPrice,
        campaignId: null,
        campaignName: null,
        type: null,
        remainingQuota: null,
        discountPercentage: 0,
      };
    }

    const checkTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
    const productIdStr = String(product._id || product.id);
    const variantIdStr = variant ? String(variant._id || variant.id || variant) : null;
    const categoryIdStr = product.category_id
      ? String(product.category_id._id || product.category_id)
      : null;

    const candidates = [];
    let exhaustedFlashCandidate = null;

    for (const campaign of campaigns) {
      const startMs = new Date(campaign.startAt).getTime();
      const endMs = new Date(campaign.endAt).getTime();
      if (checkTime < startMs || checkTime > endMs) {
        continue;
      }

      if (campaign.type === "flash_sale") {
        // Tìm cấu hình sản phẩm trong Flash Sale
        // Ưu tiên 1: Cấu hình đúng variant_id
        // Ưu tiên 2: Cấu hình áp dụng chung toàn sản phẩm (variant_id === null)
        const matchedProducts = campaignProducts.filter(
          (cp) =>
            String(cp.campaign_id) === String(campaign._id) &&
            String(cp.product_id) === productIdStr
        );

        let cpConfig = null;
        if (variantIdStr) {
          cpConfig = matchedProducts.find(
            (cp) => cp.variant_id && String(cp.variant_id) === variantIdStr
          );
        }
        if (!cpConfig) {
          cpConfig = matchedProducts.find((cp) => !cp.variant_id);
        }

        if (cpConfig) {
          const quota = Number(cpConfig.quota || 0);
          const sold = Number(cpConfig.sold || 0);
          const remainingQuota = Math.max(0, quota - sold);

          if (remainingQuota <= 0) {
            // Hết suất: Ghi nhận candidate hết suất để hiển thị UI
            if (!exhaustedFlashCandidate) {
              exhaustedFlashCandidate = {
                campaign,
                cpConfig,
                remainingQuota: 0,
              };
            }
          } else {
            const salePrice = Number(cpConfig.sale_price);
            const finalPrice = Math.min(originalPrice, Math.max(0, salePrice));
            candidates.push({
              campaign,
              type: "flash_sale",
              finalPrice,
              originalPrice,
              priority: campaign.priority || 0,
              remainingQuota,
              cpConfig,
            });
          }
        }
      } else if (campaign.type === "seasonal") {
        // Kiểm tra phạm vi áp dụng (scope: all | categories | products)
        const rule = campaign.discountRule;
        if (!rule) continue;

        let isApplicable = false;
        let overridePrice = null;

        if (rule.scope === "all") {
          isApplicable = true;
        } else if (rule.scope === "categories") {
          const catIds = (rule.categoryIds || []).map((id) => String(id));
          if (categoryIdStr && catIds.includes(categoryIdStr)) {
            isApplicable = true;
          }
        } else if (rule.scope === "products") {
          // Khi scope = products: xem có cấu hình trong campaignProducts không
          const matchedCp = campaignProducts.find(
            (cp) =>
              String(cp.campaign_id) === String(campaign._id) &&
              String(cp.product_id) === productIdStr &&
              (!variantIdStr || !cp.variant_id || String(cp.variant_id) === variantIdStr)
          );
          if (matchedCp) {
            isApplicable = true;
            overridePrice = matchedCp.sale_price;
          }
        }

        if (isApplicable) {
          let finalPrice = originalPrice;
          if (overridePrice !== null && overridePrice !== undefined) {
            finalPrice = Math.min(originalPrice, Number(overridePrice));
          } else {
            let discount = 0;
            if (rule.discountType === "percentage") {
              discount = Math.round((originalPrice * Number(rule.discountValue)) / 100);
              if (rule.maxDiscountAmount && rule.maxDiscountAmount > 0) {
                discount = Math.min(discount, Number(rule.maxDiscountAmount));
              }
            } else if (rule.discountType === "fixed") {
              discount = Number(rule.discountValue);
            }
            finalPrice = Math.max(0, originalPrice - discount);
          }

          candidates.push({
            campaign,
            type: "seasonal",
            finalPrice,
            originalPrice,
            priority: campaign.priority || 0,
            remainingQuota: null,
            cpConfig: null,
          });
        }
      }
    }

    // Quy tắc ưu tiên:
    // 1. flash_sale > seasonal
    // 2. priority cao hơn > priority thấp hơn
    // 3. Giá rẻ hơn > giá đắt hơn
    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "flash_sale" ? -1 : 1;
        }
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.finalPrice - b.finalPrice;
      });

      const best = candidates[0];
      const discountPercentage =
        best.originalPrice > best.finalPrice
          ? Math.round(((best.originalPrice - best.finalPrice) / best.originalPrice) * 100)
          : 0;

      return {
        finalPrice: best.finalPrice,
        originalPrice: best.originalPrice,
        campaignId: best.campaign._id,
        campaignName: best.campaign.name,
        type: best.type,
        remainingQuota: best.remainingQuota,
        discountPercentage,
        isSale: best.finalPrice < best.originalPrice,
        cpConfig: best.cpConfig,
      };
    }

    // Nếu không có chiến dịch nào còn quota nhưng có flash sale hết suất
    if (exhaustedFlashCandidate) {
      return {
        finalPrice: originalPrice,
        originalPrice,
        campaignId: exhaustedFlashCandidate.campaign._id,
        campaignName: exhaustedFlashCandidate.campaign.name,
        type: "flash_sale",
        remainingQuota: 0,
        discountPercentage: 0,
        isSale: false,
        isQuotaExhausted: true,
        cpConfig: exhaustedFlashCandidate.cpConfig,
      };
    }

    return {
      finalPrice: originalPrice,
      originalPrice,
      campaignId: null,
      campaignName: null,
      type: null,
      remainingQuota: null,
      discountPercentage: 0,
      isSale: false,
    };
  }

  /**
   * Áp dụng giá tính toán đồng bộ cho một danh sách sản phẩm (tránh N+1)
   */
  async resolvePricesForProducts(products, now = new Date(), userId = null) {
    if (!Array.isArray(products) || products.length === 0) {
      return [];
    }
    const bundle = await this.getActiveCampaignsBundle(now);

    return await Promise.all(
      products.map(async (prod) => {
        const prodObj = prod.toObject ? prod.toObject() : { ...prod };
        const priceInfo = await this.resolvePrice(prodObj, null, now, userId, bundle);

        return {
          ...prodObj,
          price: priceInfo.finalPrice,
          new_price: priceInfo.finalPrice,
          old_price: priceInfo.isSale ? priceInfo.originalPrice : (prodObj.old_price ?? prodObj.oldPrice ?? 0),
          oldPrice: priceInfo.isSale ? priceInfo.originalPrice : (prodObj.old_price ?? prodObj.oldPrice ?? 0),
          campaign: priceInfo.campaignId
            ? {
                id: priceInfo.campaignId,
                name: priceInfo.campaignName,
                type: priceInfo.type,
                remainingQuota: priceInfo.remainingQuota,
                discountPercentage: priceInfo.discountPercentage,
                isQuotaExhausted: priceInfo.isQuotaExhausted || false,
                isSale: priceInfo.isSale,
              }
            : null,
        };
      })
    );
  }
}

export default new PricingService();

