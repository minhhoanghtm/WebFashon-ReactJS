import cron from "node-cron";
import voucherService from "../modules/vouchers/voucher.service.js";

/**
 * Initialize voucher cron job scheduler.
 * Runs daily at 00:00.
 */
export const initVoucherCron = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ [Cron] Running voucher expiration check...");
    try {
      await voucherService.expireVoucher();
      console.log("✅ [Cron] Voucher expiration check completed successfully.");
    } catch (error) {
      console.error("❌ [Cron] Lỗi khi chạy cron job quét voucher hết hạn:", error);
    }
  });
  console.log("⏰ [Cron] Đăng ký cron job quét voucher thành công (00:00 hàng ngày).");
};
