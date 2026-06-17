import voucherRepository from "./voucher.repository.js";
import { AppError } from "../../common/exceptions/AppError.js";
import mongoose from "mongoose";
import Product from "../products/product.model.js";
import { acquireLock, releaseLock } from "../../providers/redisLock.provider.js";
import getRedisConnection from "../../configs/redis.js";

const PUBLIC_CACHE_KEY = "vouchers:public";

class VoucherService {
  /**
   * Helper to invalidate public cache
   */
  async _invalidateCache() {
    try {
      const redis = getRedisConnection();
      if (redis) {
        await redis.del(PUBLIC_CACHE_KEY);
      }
    } catch (error) {
      console.error("Cache invalidation error:", error.message);
    }
  }

  /**
   * Helper to seed default vouchers if collection is empty
   */
  async _seedVouchersIfEmpty() {
    try {
      const count = await voucherRepository.countDocuments({ isDeleted: false });
      if (count === 0) {
        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(now.getMonth() + 1);

        await voucherRepository.insertMany([
          {
            code: "PETWELCOME",
            name: "Chào mừng thành viên mới",
            description: "Giảm 10% tối đa 50.000 VNĐ cho tất cả đơn hàng phụ kiện & thức ăn thú cưng tại PetShop.",
            discountType: "percentage",
            discountValue: 10,
            maxDiscountAmount: 50000,
            minOrderValue: 100000,
            totalQuantity: 100,
            remainingQuantity: 100,
            claimedQuantity: 0,
            usedQuantity: 0,
            startDate: now,
            endDate: nextMonth,
            status: "ACTIVE",
          },
          {
            code: "PETLOVE50K",
            name: "PetShop Yêu Thương",
            description: "Giảm trực tiếp 50.000 VNĐ cho đơn hàng phụ kiện từ 300.000 VNĐ.",
            discountType: "fixed",
            discountValue: 50000,
            maxDiscountAmount: 0,
            minOrderValue: 300000,
            totalQuantity: 50,
            remainingQuantity: 50,
            claimedQuantity: 0,
            usedQuantity: 0,
            startDate: now,
            endDate: nextMonth,
            status: "ACTIVE",
          },
          {
            code: "FREESHIP30K",
            name: "Miễn phí vận chuyển Petship",
            description: "Giảm 30.000 VNĐ phí vận chuyển cho đơn hàng từ 150.000 VNĐ.",
            discountType: "fixed",
            discountValue: 30000,
            maxDiscountAmount: 0,
            minOrderValue: 150000,
            totalQuantity: 200,
            remainingQuantity: 200,
            claimedQuantity: 0,
            usedQuantity: 0,
            startDate: now,
            endDate: nextMonth,
            status: "ACTIVE",
          },
          {
            code: "SUPERPET",
            name: "Siêu ưu đãi Pet VIP",
            description: "Giảm giá 20% tối đa 150.000 VNĐ cho đơn hàng từ 500.000 VNĐ trở lên.",
            discountType: "percentage",
            discountValue: 20,
            maxDiscountAmount: 150000,
            minOrderValue: 500000,
            totalQuantity: 10,
            remainingQuantity: 10,
            claimedQuantity: 0,
            usedQuantity: 0,
            startDate: now,
            endDate: nextMonth,
            status: "ACTIVE",
          }
        ]);
        console.log("Seeded default vouchers successfully.");
      }
    } catch (error) {
      console.error("Failed to seed default vouchers:", error.message);
    }
  }

  /**
   * Helper to seed user wallet with mock data if wallet is empty
   */
  async _seedUserWalletIfEmpty(userId) {
    try {
      const count = await voucherRepository.countUserVouchers({ userId });
      if (count === 0) {
        await this._seedVouchersIfEmpty();
        const vouchers = await voucherRepository.find({ isDeleted: false }, { createdAt: -1 }, 0, 3);
        if (vouchers.length >= 3) {
          await voucherRepository.insertManyUserVouchers([
            {
              userId,
              voucherId: vouchers[0]._id || vouchers[0].id,
              status: "CLAIMED",
              claimedAt: new Date(),
            },
            {
              userId,
              voucherId: vouchers[1]._id || vouchers[1].id,
              status: "USED",
              claimedAt: new Date(),
              usedAt: new Date(),
            },
            {
              userId,
              voucherId: vouchers[2]._id || vouchers[2].id,
              status: "EXPIRED",
              claimedAt: new Date(),
            }
          ]);
          console.log(`Seeded user wallet for user ${userId} successfully.`);
        }
      }
    } catch (error) {
      console.error("Failed to seed user wallet:", error.message);
    }
  }

  /**
   * Admin: Get all vouchers with search, sort, filter, pagination
   */
  async getAdminVouchers(query) {
    await this._seedVouchersIfEmpty();
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      discountType = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const filter = { isDeleted: false };

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (discountType) {
      filter.discountType = discountType;
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const [vouchers, total] = await Promise.all([
      voucherRepository.find(filter, sort, skip, parseInt(limit, 10)),
      voucherRepository.countDocuments(filter),
    ]);

    return {
      vouchers,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    };
  }

  /**
   * Admin: Create a new voucher
   */
  async createVoucher(userId, voucherData) {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderValue,
      totalQuantity,
      startDate,
      endDate,
      status = "ACTIVE",
      voucherType = "order",
      applicableProducts = [],
      applicableCategories = [],
    } = voucherData;

    const uppercaseCode = code.trim().toUpperCase();

    // Check if code exists
    const existingVoucher = await voucherRepository.findOne({ code: uppercaseCode, isDeleted: false });
    if (existingVoucher) {
      throw new AppError("Mã giảm giá đã tồn tại", 400);
    }

    if (new Date(endDate) <= new Date(startDate)) {
      throw new AppError("Ngày kết thúc phải lớn hơn ngày bắt đầu", 400);
    }

    if (discountValue <= 0) {
      throw new AppError("Giá trị giảm giá phải lớn hơn 0", 400);
    }

    if (totalQuantity <= 0) {
      throw new AppError("Tổng số lượng voucher phải lớn hơn 0", 400);
    }

    const voucher = await voucherRepository.create({
      code: uppercaseCode,
      name,
      description,
      discountType,
      discountValue,
      maxDiscountAmount: discountType === "percentage" ? maxDiscountAmount || 0 : 0,
      minOrderValue: minOrderValue || 0,
      totalQuantity,
      remainingQuantity: totalQuantity,
      startDate,
      endDate,
      status,
      voucherType,
      applicableProducts,
      applicableCategories,
    });

    // Write Audit Log
    await voucherRepository.createHistory({
      voucherId: voucher._id || voucher.id,
      action: "CREATE",
      userId,
      details: { voucher: voucher.toObject ? voucher.toObject() : voucher },
    });

    // Invalidate Cache
    await this._invalidateCache();

    return voucher;
  }

  /**
   * Admin: Update a voucher
   */
  async updateVoucher(userId, id, updateData) {
    const { name, description, endDate, totalQuantity, status, voucherType, applicableProducts, applicableCategories } = updateData;

    const voucher = await voucherRepository.findOne({ _id: id, isDeleted: false });
    if (!voucher) {
      throw new AppError("Voucher không tồn tại hoặc đã bị xóa", 404);
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (voucherType !== undefined) updates.voucherType = voucherType;
    if (applicableProducts !== undefined) updates.applicableProducts = applicableProducts;
    if (applicableCategories !== undefined) updates.applicableCategories = applicableCategories;

    if (endDate !== undefined) {
      if (new Date(endDate) <= new Date(voucher.startDate)) {
        throw new AppError("Ngày kết thúc phải lớn hơn ngày bắt đầu", 400);
      }
      updates.endDate = endDate;
    }

    if (totalQuantity !== undefined) {
      if (totalQuantity < voucher.claimedQuantity) {
        throw new AppError(
          `Không thể giảm tổng số lượng nhỏ hơn số lượng đã được claim (${voucher.claimedQuantity})`,
          400
        );
      }
      updates.totalQuantity = totalQuantity;
      updates.remainingQuantity = totalQuantity - voucher.claimedQuantity;
    }

    const updatedVoucher = await voucherRepository.findOneAndUpdate({ _id: id }, { $set: updates }, { new: true });

    // Write Audit Log
    await voucherRepository.createHistory({
      voucherId: id,
      action: "UPDATE",
      userId,
      details: { updates, oldVoucher: voucher.toObject ? voucher.toObject() : voucher },
    });

    // Invalidate Cache
    await this._invalidateCache();

    return updatedVoucher;
  }

  /**
   * Admin: Soft Delete a voucher
   */
  async deleteVoucher(userId, id) {
    const voucher = await voucherRepository.findOne({ _id: id, isDeleted: false });
    if (!voucher) {
      throw new AppError("Voucher không tồn tại hoặc đã bị xóa trước đó", 404);
    }

    voucher.isDeleted = true;
    await voucherRepository.save(voucher);

    // Write Audit Log
    await voucherRepository.createHistory({
      voucherId: id,
      action: "DELETE",
      userId,
      details: { message: "Voucher soft deleted" },
    });

    // Invalidate Cache
    await this._invalidateCache();

    return { success: true };
  }

  /**
   * Admin: Toggle Voucher status (ACTIVE/INACTIVE)
   */
  async toggleVoucherStatus(userId, id) {
    const voucher = await voucherRepository.findOne({ _id: id, isDeleted: false });
    if (!voucher) {
      throw new AppError("Voucher không tồn tại", 404);
    }

    voucher.status = voucher.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await voucherRepository.save(voucher);

    // Write Audit Log
    await voucherRepository.createHistory({
      voucherId: id,
      action: "STATUS_CHANGE",
      userId,
      details: { status: voucher.status },
    });

    // Invalidate Cache
    await this._invalidateCache();

    return voucher;
  }

  /**
   * User: Get public active vouchers for Hunting Page (with Redis caching)
   */
  async getPublicVouchers() {
    await this._seedVouchersIfEmpty();
    try {
      const redis = getRedisConnection();
      if (redis) {
        const cached = await redis.get(PUBLIC_CACHE_KEY);
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch (err) {
      console.error("Redis cache read error:", err.message);
    }

    const now = new Date();
    const vouchers = await voucherRepository.find({
      status: "ACTIVE",
      isDeleted: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
      remainingQuantity: { $gt: 0 },
    }, { createdAt: -1 });

    try {
      const redis = getRedisConnection();
      if (redis) {
        // Cache public vouchers list for 5 minutes (300 seconds)
        await redis.set(PUBLIC_CACHE_KEY, JSON.stringify(vouchers), "EX", 300);
      }
    } catch (err) {
      console.error("Redis cache write error:", err.message);
    }

    return vouchers;
  }

  /**
   * User: Claim a voucher (with SETNX Lock & Atomic Update)
   */
  async claimVoucher(userId, voucherId) {
    await this._seedVouchersIfEmpty();
    const lockKey = `lock:claim:${userId}:${voucherId}`;
    
    const acquired = await acquireLock(lockKey, 5000);
    if (!acquired) {
      throw new AppError("Thao tác quá nhanh. Vui lòng thử lại.", 429);
    }

    try {
      // 1. Check if user already claimed this voucher
      const existingClaim = await voucherRepository.findOneUserVoucher({ userId, voucherId });
      if (existingClaim) {
        throw new AppError("Bạn đã nhận voucher này rồi", 400);
      }

      // 2. Validate voucher existence, dates, and active status
      const now = new Date();
      const voucher = await voucherRepository.findOne({
        _id: voucherId,
        status: "ACTIVE",
        isDeleted: false,
        startDate: { $lte: now },
        endDate: { $gte: now },
      });

      if (!voucher) {
        throw new AppError("Voucher không tồn tại hoặc đã hết hiệu lực", 404);
      }

      if (voucher.remainingQuantity <= 0) {
        throw new AppError("Voucher đã hết số lượng", 400);
      }

      // 3. Atomic Decrement of remainingQuantity at database level
      const updatedVoucher = await voucherRepository.findOneAndUpdate(
        {
          _id: voucherId,
          status: "ACTIVE",
          isDeleted: false,
          remainingQuantity: { $gt: 0 },
        },
        {
          $inc: { remainingQuantity: -1, claimedQuantity: 1 },
        },
        { new: true }
      );

      if (!updatedVoucher) {
        throw new AppError("Voucher vừa mới hết số lượng hoặc hết hiệu lực", 400);
      }

      // 4. Create the UserVoucher record in the wallet
      const userVoucher = await voucherRepository.createUserVoucher({
        userId,
        voucherId,
        status: "CLAIMED",
      });

      // 5. Write Audit Log
      await voucherRepository.createHistory({
        voucherId,
        action: "CLAIM",
        userId,
        details: { message: "User claimed voucher successfully" },
      });

      // 6. Invalidate public list cache
      await this._invalidateCache();

      return userVoucher;
    } finally {
      await releaseLock(lockKey);
    }
  }

  /**
   * User: Get user voucher wallet (with status filter)
   */
  async getUserWallet(userId, status) {
    await this._seedUserWalletIfEmpty(userId);
    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    return await voucherRepository.findUserWallet(filter);
  }

  /**
   * Core/Checkout: Validate voucher for application
   */
  async validateVoucher(userId, code, subtotal, items = [], shippingFee = 0) {
    await this._seedUserWalletIfEmpty(userId);
    const uppercaseCode = code.trim().toUpperCase();

    // 1. Find the voucher
    const voucher = await voucherRepository.findOne({ code: uppercaseCode, isDeleted: false });
    if (!voucher) {
      throw new AppError("Mã giảm giá không tồn tại", 404);
    }

    // 2. Check general status and dates
    if (voucher.status !== "ACTIVE") {
      throw new AppError("Mã giảm giá đang tạm khóa", 400);
    }

    const now = new Date();
    if (new Date(voucher.startDate) > now) {
      throw new AppError("Chương trình giảm giá chưa bắt đầu", 400);
    }
    if (new Date(voucher.endDate) < now) {
      throw new AppError("Mã giảm giá đã hết hạn", 400);
    }

    // 3. Verify user owns the voucher
    const userVoucher = await voucherRepository.findOneUserVoucher({
      userId,
      voucherId: voucher._id || voucher.id,
    });

    if (!userVoucher) {
      throw new AppError("Bạn chưa sở hữu voucher này trong ví. Hãy nhận voucher trước.", 400);
    }

    if (userVoucher.status === "USED") {
      throw new AppError("Bạn đã sử dụng voucher này cho đơn hàng khác", 400);
    }

    if (userVoucher.status === "EXPIRED") {
      throw new AppError("Voucher của bạn đã hết hạn sử dụng", 400);
    }

    // 4. Calculate discount amount and check min value based on voucher type
    const currentSubtotal = Number(subtotal) || 0;
    let discountAmount = 0;
    const vType = voucher.voucherType || "order";

    if (vType === "product") {
      // Product-specific / Category-specific voucher
      if (!items || items.length === 0) {
        // Fallback: treat entire subtotal as applicable
        const baseAmount = currentSubtotal;
        if (baseAmount < voucher.minOrderValue) {
          throw new AppError(
            `Mã giảm giá này áp dụng cho đơn hàng tối thiểu từ ${voucher.minOrderValue.toLocaleString("vi-VN")}đ`,
            400
          );
        }
        if (voucher.discountType === "percentage") {
          discountAmount = Math.round((voucher.discountValue / 100) * baseAmount);
          if (voucher.maxDiscountAmount > 0) {
            discountAmount = Math.min(discountAmount, voucher.maxDiscountAmount);
          }
        } else {
          discountAmount = voucher.discountValue;
        }
        discountAmount = Math.min(discountAmount, baseAmount);
      } else {
        // Fetch products to verify categories
        const productIds = items.map(item => item.product_id || item.productItem?.product_id).filter(Boolean);
        const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
        const productMap = new Map(dbProducts.map(p => [p._id.toString(), p]));

        const appProducts = (voucher.applicableProducts || []).map(id => id.toString());
        const appCategories = (voucher.applicableCategories || []).map(id => id.toString());

        // Filter items that are applicable
        const applicableItems = items.filter(item => {
          const prodId = (item.product_id || item.productItem?.product_id)?.toString();
          if (!prodId) return false;
          
          if (appProducts.includes(prodId)) return true;

          const prod = productMap.get(prodId);
          if (prod && prod.category_id && appCategories.includes(prod.category_id.toString())) {
            return true;
          }
          return false;
        });

        if (applicableItems.length === 0) {
          throw new AppError("Mã giảm giá không áp dụng cho bất kỳ sản phẩm nào trong giỏ hàng", 400);
        }

        const applicableSubtotal = applicableItems.reduce(
          (sum, item) => sum + (Number(item.new_price || item.price || 0) * (item.quantity || 1)),
          0
        );

        if (applicableSubtotal < voucher.minOrderValue) {
          throw new AppError(
            `Mã giảm giá này áp dụng cho các sản phẩm hợp lệ có tổng giá trị tối thiểu từ ${voucher.minOrderValue.toLocaleString("vi-VN")}đ`,
            400
          );
        }

        if (voucher.discountType === "percentage") {
          discountAmount = Math.round((voucher.discountValue / 100) * applicableSubtotal);
          if (voucher.maxDiscountAmount > 0) {
            discountAmount = Math.min(discountAmount, voucher.maxDiscountAmount);
          }
        } else {
          discountAmount = voucher.discountValue;
        }
        discountAmount = Math.min(discountAmount, applicableSubtotal);
      }
    } else if (vType === "shipping") {
      // Shipping discount / free shipping voucher
      if (currentSubtotal < voucher.minOrderValue) {
        throw new AppError(
          `Mã miễn phí vận chuyển áp dụng cho đơn hàng tối thiểu từ ${voucher.minOrderValue.toLocaleString("vi-VN")}đ`,
          400
        );
      }

      const activeShippingFee = Number(shippingFee) || 0;
      if (activeShippingFee <= 0) {
        discountAmount = 0;
      } else {
        if (voucher.discountType === "percentage") {
          discountAmount = Math.round((voucher.discountValue / 100) * activeShippingFee);
          if (voucher.maxDiscountAmount > 0) {
            discountAmount = Math.min(discountAmount, voucher.maxDiscountAmount);
          }
        } else {
          discountAmount = voucher.discountValue;
        }
        discountAmount = Math.min(discountAmount, activeShippingFee);
      }
    } else {
      // Order / general voucher
      if (currentSubtotal < voucher.minOrderValue) {
        throw new AppError(
          `Mã giảm giá này áp dụng cho đơn hàng tối thiểu từ ${voucher.minOrderValue.toLocaleString("vi-VN")}đ`,
          400
        );
      }

      if (voucher.discountType === "percentage") {
        discountAmount = Math.round((voucher.discountValue / 100) * currentSubtotal);
        if (voucher.maxDiscountAmount > 0) {
          discountAmount = Math.min(discountAmount, voucher.maxDiscountAmount);
        }
      } else {
        discountAmount = voucher.discountValue;
      }
      discountAmount = Math.min(discountAmount, currentSubtotal);
    }

    return {
      voucherId: voucher._id || voucher.id,
      code: voucher.code,
      name: voucher.name,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      discountAmount,
      voucherType: vType,
    };
  }

  /**
   * Admin: Get statistics and chart data for the dashboard
   */
  async getAdminDashboardStats() {
    await this._seedVouchersIfEmpty();
    const now = new Date();

    const [
      totalVouchers,
      activeVouchers,
      expiredVouchers,
      soldOutVouchers,
      topVouchers,
    ] = await Promise.all([
      voucherRepository.countDocuments({ isDeleted: false }),
      voucherRepository.countDocuments({ status: "ACTIVE", isDeleted: false, endDate: { $gte: now } }),
      voucherRepository.countDocuments({ isDeleted: false, endDate: { $lt: now } }),
      voucherRepository.countDocuments({ isDeleted: false, remainingQuantity: 0 }),
      voucherRepository.find({ isDeleted: false }, { usedQuantity: -1 }, 0, 5),
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const claimsAggregate = await voucherRepository.aggregateUserVouchers([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const usagesAggregate = await voucherRepository.aggregateUsage([
      {
        $match: {
          usedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$usedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const chartLabels = [];
    const claimsData = [];
    const usagesData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      chartLabels.push(dateStr);

      const claimObj = claimsAggregate.find((c) => c._id === dateStr);
      claimsData.push(claimObj ? claimObj.count : 0);

      const usageObj = usagesAggregate.find((u) => u._id === dateStr);
      usagesData.push(usageObj ? usageObj.count : 0);
    }

    return {
      stats: {
        totalVouchers,
        activeVouchers,
        expiredVouchers,
        soldOutVouchers,
      },
      topVouchers: topVouchers.map((v) => ({
        code: v.code,
        name: v.name,
        usedQuantity: v.usedQuantity,
        totalQuantity: v.totalQuantity,
      })),
      charts: {
        labels: chartLabels,
        claims: claimsData,
        usages: usagesData,
      },
    };
  }

  // ==========================================
  // High-Level Domain Business Logic Methods
  // ==========================================

  /**
   * Apply a voucher to an order (increment used count, mark UserVoucher as USED, create VoucherUsage)
   */
  async applyVoucher(userId, voucherCode, orderId, discountAmount, options = {}) {
    const uppercaseCode = voucherCode.toUpperCase();
    const voucher = await voucherRepository.findOne({ code: uppercaseCode, isDeleted: false });
    if (!voucher) {
      throw new AppError("Voucher không tồn tại", 404);
    }

    // 1. Increment usedQuantity of the Voucher (with atomic safeguard to not exceed totalQuantity)
    const voucherUpdate = await voucherRepository.findOneAndUpdate(
      { 
        _id: voucher._id, 
        isDeleted: false,
        $expr: { $lt: ["$usedQuantity", "$totalQuantity"] }
      },
      { $inc: { usedQuantity: 1 } },
      { ...options, new: true }
    );

    if (!voucherUpdate) {
      throw new AppError("Không thể áp dụng voucher này (đã hết lượt sử dụng)", 400);
    }

    // 2. Mark UserVoucher status as USED
    const userVoucherUpdate = await voucherRepository.findOneAndUpdateUserVoucher(
      { userId, voucherId: voucher._id, status: "CLAIMED" },
      { $set: { status: "USED", usedAt: new Date() } },
      { ...options, new: true }
    );

    if (!userVoucherUpdate) {
      throw new AppError("Voucher của bạn đã được sử dụng hoặc không hợp lệ", 400);
    }

    // 3. Create VoucherUsage record
    await voucherRepository.createUsage({
      userId,
      voucherId: voucher._id,
      orderId,
      discountAmount,
      usedAt: new Date(),
    }, options);

    // 4. Log to history
    await voucherRepository.createHistory({
      voucherId: voucher._id,
      action: "USE",
      userId,
      details: { orderId, discountAmount },
    }, options);

    return voucherUpdate;
  }

  /**
   * Apply a voucher with a temporary placeholder orderId (for transactional checkout flow)
   */
  async applyVoucherWithPlaceholder(userId, voucherCode, discountAmount, options = {}) {
    const uppercaseCode = voucherCode.toUpperCase();
    const voucher = await voucherRepository.findOne({ code: uppercaseCode, isDeleted: false });
    if (!voucher) {
      throw new AppError("Voucher không tồn tại", 404);
    }

    // 1. Increment usedQuantity of the Voucher (Atomic operation with safeguard)
    const voucherUpdate = await voucherRepository.findOneAndUpdate(
      { 
        _id: voucher._id, 
        isDeleted: false,
        $expr: { $lt: ["$usedQuantity", "$totalQuantity"] }
      },
      { $inc: { usedQuantity: 1 } },
      { ...options, new: true }
    );

    if (!voucherUpdate) {
      throw new AppError("Không thể áp dụng voucher này (đã hết lượt sử dụng)", 400);
    }

    // 2. Mark UserVoucher status as USED (Atomic operation)
    const userVoucherUpdate = await voucherRepository.findOneAndUpdateUserVoucher(
      { userId, voucherId: voucher._id, status: "CLAIMED" },
      { $set: { status: "USED", usedAt: new Date() } },
      { ...options, new: true }
    );

    if (!userVoucherUpdate) {
      throw new AppError("Voucher của bạn đã được sử dụng hoặc không hợp lệ", 400);
    }

    // Create a temporary placeholder orderId
    const placeholderOrderId = new mongoose.Types.ObjectId();

    // 3. Create VoucherUsage record with placeholder orderId
    await voucherRepository.createUsage({
      userId,
      voucherId: voucher._id,
      orderId: placeholderOrderId,
      discountAmount,
      usedAt: new Date(),
    }, options);

    // 4. Log to history
    await voucherRepository.createHistory({
      voucherId: voucher._id,
      action: "USE",
      userId,
      details: { note: "Apply voucher with placeholder orderId", placeholderOrderId, discountAmount },
    }, options);

    return voucherUpdate;
  }

  /**
   * Link the temporary placeholder orderId in VoucherUsage to the actual order ID
   */
  async linkVoucherUsageToOrder(userId, voucherId, orderId, options = {}) {
    const updatedUsage = await voucherRepository.findOneAndUpdateUsage(
      { userId, voucherId, orderId: { $ne: orderId } },
      { $set: { orderId } },
      options
    );
    return updatedUsage;
  }

  /**
   * Apply voucher without creating the usage record (for non-transactional checkout flow)
   */
  async applyVoucherNoUsage(userId, voucherCode, options = {}) {
    const uppercaseCode = voucherCode.toUpperCase();
    const voucher = await voucherRepository.findOne({ code: uppercaseCode, isDeleted: false });
    if (!voucher) {
      throw new AppError("Voucher không tồn tại", 404);
    }

    // 1. Increment usedQuantity of the Voucher (with atomic safeguard)
    const updateResult = await voucherRepository.updateOne(
      { 
        _id: voucher._id,
        $expr: { $lt: ["$usedQuantity", "$totalQuantity"] }
      },
      { $inc: { usedQuantity: 1 } },
      options
    );

    if (updateResult.modifiedCount === 0) {
      throw new AppError("Không thể áp dụng voucher này (đã hết lượt sử dụng)", 400);
    }

    // 2. Mark UserVoucher status as USED
    await voucherRepository.updateUserVoucher(
      { userId, voucherId: voucher._id, status: "CLAIMED" },
      { $set: { status: "USED", usedAt: new Date() } },
      options
    );

    return voucher._id;
  }

  /**
   * Create a voucher usage record (for non-transactional checkout flow)
   */
  async createVoucherUsage(userId, voucherId, orderId, discountAmount, options = {}) {
    return await voucherRepository.createUsage({
      userId,
      voucherId,
      orderId,
      discountAmount,
      usedAt: new Date(),
    }, options);
  }

  /**
   * Rollback voucher usage if order creation fails or is cancelled
   */
  async rollbackVoucherUsage(userId, voucherCode, orderId, options = {}) {
    const uppercaseCode = voucherCode.toUpperCase();
    const voucher = await voucherRepository.findOne({ code: uppercaseCode, isDeleted: false });
    if (!voucher) return;

    // 1. Decrement usedQuantity of the Voucher
    await voucherRepository.updateOne(
      { _id: voucher._id },
      { $inc: { usedQuantity: -1 } },
      options
    );

    // 2. Reset UserVoucher status back to CLAIMED
    await voucherRepository.updateUserVoucher(
      { userId, voucherId: voucher._id, status: "USED" },
      { $set: { status: "CLAIMED" }, $unset: { usedAt: "" } },
      options
    );

    // 3. Delete VoucherUsage record
    await voucherRepository.deleteOneUsage(
      { userId, voucherId: voucher._id, orderId },
      options
    );

    // 4. Log to history
    await voucherRepository.createHistory({
      voucherId: voucher._id,
      action: "UPDATE",
      userId,
      details: { note: "Rollback voucher usage due to order failure/cancellation", orderId },
    }, options);
  }

  /**
   * Expire vouchers whose endDate has passed
   */
  async expireVoucher() {
    const now = new Date();
    
    // 1. Find expired Vouchers
    const expiredVouchers = await voucherRepository.find({
      status: "ACTIVE",
      isDeleted: false,
      endDate: { $lt: now }
    });

    if (expiredVouchers.length > 0) {
      const expiredIds = expiredVouchers.map(v => v._id || v.id);
      
      // Update status to INACTIVE
      await voucherRepository.updateOne(
        { _id: { $in: expiredIds } },
        { $set: { status: "INACTIVE" } }
      );

      // Create history logs
      const historyLogs = expiredIds.map(id => ({
        voucherId: id,
        action: "EXPIRED",
        userId: null,
        details: { message: "Voucher tự động hết hạn do hệ thống quét định kỳ." }
      }));
      await voucherRepository.createHistory(historyLogs);
      console.log(`✅ [Cron/Service] Đã chuyển trạng thái ${expiredVouchers.length} voucher hết hạn thành INACTIVE.`);
    }

    // 2. Expire claimed UserVouchers
    const claimedUserVouchers = await voucherRepository.findUserVouchers({ status: "CLAIMED" });
    let expiredUserVoucherCount = 0;

    for (const uv of claimedUserVouchers) {
      const v = await voucherRepository.findById(uv.voucherId);
      if (!v || new Date(v.endDate) < now) {
        uv.status = "EXPIRED";
        await voucherRepository.save(uv);
        expiredUserVoucherCount++;
      }
    }

    if (expiredUserVoucherCount > 0) {
      console.log(`✅ [Cron/Service] Đã chuyển trạng thái ${expiredUserVoucherCount} ví voucher của user sang EXPIRED.`);
    }
  }
}

export default new VoucherService();
