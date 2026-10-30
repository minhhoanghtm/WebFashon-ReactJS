import cron from "node-cron";
import Campaign from "../modules/campaigns/campaign.model.js";
import pricingService from "../modules/campaigns/pricing.service.js";
import {
  acquireDistributedLock,
  releaseDistributedLock,
} from "../providers/redisLock.provider.js";

let isRunning = false;
const CRON_LOCK_KEY = "cron:lock:campaign_transition";
const CRON_LOCK_TTL = 25000; // 25s

/**
 * Campaign Status Transition Cron Job.
 *
 * Runs every minute (* * * * *).
 * 1. Chuyển scheduled -> active khi startAt <= now < endAt
 * 2. Chuyển active / scheduled -> ended khi endAt <= now
 * Phân tán an toàn qua Redis lock, idempotent, tự động xóa cache khi có thay đổi trạng thái.
 */
export const runCampaignStatusTransition = async () => {
  const now = new Date();
  let statusChanged = false;

  // 1. Chuyển các chiến dịch đã đến giờ bắt đầu: scheduled -> active
  const activatedResult = await Campaign.updateMany(
    {
      isDeleted: false,
      status: "scheduled",
      startAt: { $lte: now },
      endAt: { $gt: now },
    },
    {
      $set: { status: "active" },
    }
  );

  if (activatedResult.modifiedCount > 0) {
    console.log(`⏰ [Campaign Cron] Đã kích hoạt ${activatedResult.modifiedCount} chiến dịch sang "active".`);
    statusChanged = true;
  }

  // 2. Chuyển các chiến dịch đã hết hạn: (active hoặc scheduled) -> ended
  const endedResult = await Campaign.updateMany(
    {
      isDeleted: false,
      status: { $in: ["active", "scheduled"] },
      endAt: { $lte: now },
    },
    {
      $set: { status: "ended" },
    }
  );

  if (endedResult.modifiedCount > 0) {
    console.log(`⏰ [Campaign Cron] Đã kết thúc ${endedResult.modifiedCount} chiến dịch sang "ended".`);
    statusChanged = true;
  }

  // Xóa cache chiến dịch nếu có sự thay đổi trạng thái
  if (statusChanged) {
    await pricingService.invalidateActiveCampaignsCache();
    console.log("⏰ [Campaign Cron] Đã xóa cache chiến dịch sau khi cập nhật trạng thái.");
  }

  return {
    activatedCount: activatedResult.modifiedCount,
    endedCount: endedResult.modifiedCount,
    statusChanged,
  };
};

export const initCampaignCron = () => {
  cron.schedule("* * * * *", async () => {
    if (isRunning) {
      console.log("⏰ [Campaign Cron] Job trước đó vẫn đang chạy, bỏ qua nhịp này");
      return;
    }
    isRunning = true;

    let lockToken = null;
    try {
      // Bảo vệ phân tán qua Redis lock để nhiều worker/instance không chạy trùng
      const { acquired, token } = await acquireDistributedLock(CRON_LOCK_KEY, CRON_LOCK_TTL);
      if (!acquired) {
        return; // Instance khác đang thực thi
      }
      lockToken = token;

      await runCampaignStatusTransition();
    } catch (error) {
      console.error("❌ [Campaign Cron] Lỗi xử lý cron chiến dịch:", error.message);
    } finally {
      if (lockToken) {
        await releaseDistributedLock(CRON_LOCK_KEY, lockToken);
      }
      isRunning = false;
    }
  });

  console.log("⏰ [Campaign Cron] Đã đăng ký tác vụ chuyển trạng thái chiến dịch tự động (mỗi 1 phút).");
};

