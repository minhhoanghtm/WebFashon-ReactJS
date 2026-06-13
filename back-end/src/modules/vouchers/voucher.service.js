import Voucher from "./voucher.model.js";
import UserVoucher from "./userVoucher.model.js";
import VoucherUsage from "./voucherUsage.model.js";
import VoucherHistory from "./voucherHistory.model.js";
import { AppError } from "../../common/exceptions/AppError.js";
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
      const count = await Voucher.countDocuments({ isDeleted: false });
      if (count === 0) {
        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(now.getMonth() + 1);

        await Voucher.insertMany([
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
      const count = await UserVoucher.countDocuments({ userId });
      if (count === 0) {
        await this._seedVouchersIfEmpty();
        const vouchers = await Voucher.find({ isDeleted: false }).limit(3);
        if (vouchers.length >= 3) {
          await UserVoucher.insertMany([
            {
              userId,
              voucherId: vouchers[0]._id,
              status: "CLAIMED",
              claimedAt: new Date(),
            },
            {
              userId,
              voucherId: vouchers[1]._id,
              status: "USED",
              claimedAt: new Date(),
              usedAt: new Date(),
            },
            {
              userId,
              voucherId: vouchers[2]._id,
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
      Voucher.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Voucher.countDocuments(filter),
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
    } = voucherData;

    const uppercaseCode = code.trim().toUpperCase();

    // Check if code exists (including soft-deleted)
    const existingVoucher = await Voucher.findOne({ code: uppercaseCode, isDeleted: false });
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

    const voucher = await Voucher.create({
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
    });

    // Write Audit Log
    await VoucherHistory.create({
      voucherId: voucher._id,
      action: "CREATE",
      userId,
      details: { voucher: voucher.toObject() },
    });

    // Invalidate Cache
    await this._invalidateCache();

    return voucher;
  }

  /**
   * Admin: Update a voucher
   */
  async updateVoucher(userId, id, updateData) {
    const { name, description, endDate, totalQuantity, status } = updateData;

    const voucher = await Voucher.findOne({ _id: id, isDeleted: false });
    if (!voucher) {
      throw new AppError("Voucher không tồn tại hoặc đã bị xóa", 404);
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;

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

    const updatedVoucher = await Voucher.findByIdAndUpdate(id, { $set: updates }, { returnDocument: "after" });

    // Write Audit Log
    await VoucherHistory.create({
      voucherId: id,
      action: "UPDATE",
      userId,
      details: { updates, oldVoucher: voucher.toObject() },
    });

    // Invalidate Cache
    await this._invalidateCache();

    return updatedVoucher;
  }

  /**
   * Admin: Soft Delete a voucher
   */
  async deleteVoucher(userId, id) {
    const voucher = await Voucher.findOne({ _id: id, isDeleted: false });
    if (!voucher) {
      throw new AppError("Voucher không tồn tại hoặc đã bị xóa trước đó", 404);
    }

    voucher.isDeleted = true;
    await voucher.save();

    // Write Audit Log
    await VoucherHistory.create({
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
    const voucher = await Voucher.findOne({ _id: id, isDeleted: false });
    if (!voucher) {
      throw new AppError("Voucher không tồn tại", 404);
    }

    voucher.status = voucher.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await voucher.save();

    // Write Audit Log
    await VoucherHistory.create({
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
    const vouchers = await Voucher.find({
      status: "ACTIVE",
      isDeleted: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
      remainingQuantity: { $gt: 0 },
    }).sort({ createdAt: -1 });

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
    
    // Acquire Redis SETNX Lock to prevent simultaneous requests from the same user
    const acquired = await acquireLock(lockKey, 5000);
    if (!acquired) {
      throw new AppError("Thao tác quá nhanh. Vui lòng thử lại.", 429);
    }

    try {
      // 1. Check if user already claimed this voucher
      const existingClaim = await UserVoucher.findOne({ userId, voucherId });
      if (existingClaim) {
        throw new AppError("Bạn đã nhận voucher này rồi", 400);
      }

      // 2. Validate voucher existence, dates, and active status
      const now = new Date();
      const voucher = await Voucher.findOne({
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
      // Only decrement if remainingQuantity is greater than 0
      const updatedVoucher = await Voucher.findOneAndUpdate(
        {
          _id: voucherId,
          status: "ACTIVE",
          isDeleted: false,
          remainingQuantity: { $gt: 0 },
        },
        {
          $inc: { remainingQuantity: -1, claimedQuantity: 1 },
        },
        { returnDocument: "after" }
      );

      if (!updatedVoucher) {
        throw new AppError("Voucher vừa mới hết số lượng hoặc hết hiệu lực", 400);
      }

      // 4. Create the UserVoucher record in the wallet
      const userVoucher = await UserVoucher.create({
        userId,
        voucherId,
        status: "CLAIMED",
      });

      // 5. Write Audit Log
      await VoucherHistory.create({
        voucherId,
        action: "CLAIM",
        userId,
        details: { message: "User claimed voucher successfully" },
      });

      // 6. Invalidate public list cache since quantities changed
      await this._invalidateCache();

      return userVoucher;
    } finally {
      // Release lock
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

    return await UserVoucher.find(filter)
      .populate({
        path: "voucherId",
        match: { isDeleted: false },
      })
      .sort({ createdAt: -1 });
  }

  /**
   * Core/Checkout: Validate voucher for application
   */
  async validateVoucher(userId, code, subtotal) {
    await this._seedUserWalletIfEmpty(userId);
    const uppercaseCode = code.trim().toUpperCase();

    // 1. Find the voucher
    const voucher = await Voucher.findOne({ code: uppercaseCode, isDeleted: false });
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

    // 3. Check min order value requirement
    const currentSubtotal = Number(subtotal) || 0;
    if (currentSubtotal < voucher.minOrderValue) {
      throw new AppError(
        `Mã giảm giá này áp dụng cho đơn hàng tối thiểu từ ${voucher.minOrderValue.toLocaleString("vi-VN")}đ`,
        400
      );
    }

    // 4. Verify user owns the voucher and it is unclaimed/unused
    const userVoucher = await UserVoucher.findOne({
      userId,
      voucherId: voucher._id,
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

    // 5. Calculate discount amount
    let discountAmount = 0;
    if (voucher.discountType === "percentage") {
      discountAmount = Math.round((voucher.discountValue / 100) * currentSubtotal);
      if (voucher.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, voucher.maxDiscountAmount);
      }
    } else if (voucher.discountType === "fixed") {
      discountAmount = voucher.discountValue;
    }

    // Ensure discount amount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, currentSubtotal);

    return {
      voucherId: voucher._id,
      code: voucher.code,
      name: voucher.name,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      discountAmount,
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
      Voucher.countDocuments({ isDeleted: false }),
      Voucher.countDocuments({ status: "ACTIVE", isDeleted: false, endDate: { $gte: now } }),
      Voucher.countDocuments({ isDeleted: false, endDate: { $lt: now } }),
      Voucher.countDocuments({ isDeleted: false, remainingQuantity: 0 }),
      Voucher.find({ isDeleted: false }).sort({ usedQuantity: -1 }).limit(5),
    ]);

    // Graph Data: Claims & Usages in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Aggregate Claims grouped by day
    const claimsAggregate = await UserVoucher.aggregate([
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

    // Aggregate Usages grouped by day
    const usagesAggregate = await VoucherUsage.aggregate([
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

    // Formulate 7-day timeline keys to align both datasets
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
}

export default new VoucherService();
