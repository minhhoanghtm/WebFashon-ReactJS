import cron from "node-cron";
import Voucher from "../modules/vouchers/voucher.model.js";
import UserVoucher from "../modules/vouchers/userVoucher.model.js";
import VoucherHistory from "../modules/vouchers/voucherHistory.model.js";

/**
 * Initialize voucher cron job scheduler.
 * Runs daily at 00:00.
 */
export const initVoucherCron = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ [Cron] Running voucher expiration check...");
    const now = new Date();
    try {
      // 1. Quét và tắt các Voucher hết hạn
      const expiredVouchers = await Voucher.find({
        status: "ACTIVE",
        isDeleted: false,
        endDate: { $lt: now }
      });

      if (expiredVouchers.length > 0) {
        const expiredIds = expiredVouchers.map(v => v._id);
        
        // Đổi trạng thái sang INACTIVE
        await Voucher.updateMany(
          { _id: { $in: expiredIds } },
          { $set: { status: "INACTIVE" } }
        );

        // Ghi Audit Log cho hệ thống
        const historyLogs = expiredIds.map(id => ({
          voucherId: id,
          action: "EXPIRED",
          userId: null,
          details: { message: "Voucher tự động hết hạn do hệ thống quét định kỳ." }
        }));
        await VoucherHistory.insertMany(historyLogs);

        console.log(`✅ [Cron] Đã chuyển trạng thái ${expiredVouchers.length} voucher hết hạn thành INACTIVE.`);
      }

      // 2. Quét các UserVoucher hết hạn
      // Tìm các UserVoucher có status CLAIMED và populate voucherId
      const claimedUserVouchers = await UserVoucher.find({ status: "CLAIMED" }).populate("voucherId");
      
      let expiredUserVoucherCount = 0;
      for (const uv of claimedUserVouchers) {
        // Nếu không có voucherId tương ứng hoặc voucher đã quá hạn
        if (!uv.voucherId || new Date(uv.voucherId.endDate) < now) {
          uv.status = "EXPIRED";
          await uv.save();
          expiredUserVoucherCount++;
        }
      }

      if (expiredUserVoucherCount > 0) {
        console.log(`✅ [Cron] Đã chuyển trạng thái ${expiredUserVoucherCount} ví voucher của user sang EXPIRED.`);
      }
    } catch (error) {
      console.error("❌ [Cron] Lỗi khi chạy cron job quét voucher hết hạn:", error);
    }
  });
  console.log("⏰ [Cron] Đăng ký cron job quét voucher thành công (00:00 hàng ngày).");
};
