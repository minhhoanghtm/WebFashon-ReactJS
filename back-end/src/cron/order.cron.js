import cron from "node-cron";
import Order from "../modules/orders/order.model.js";
import orderFacade from "../modules/orders/order.facade.js";

// Time limit in milliseconds (15 minutes)
const RESERVATION_TIMEOUT_MS = 15 * 60 * 1000;
let isRunning = false;

/**
 * Reservation Timeout Cron Job.
 *
 * Runs every minute. Finds all online-payment orders (VNPay / MoMo)
 * that are still "pending" and were created more than 15 minutes ago,
 * then cancels each one through the shared orderService.cancelExpiredOrder()
 * flow, which:
 *   1. Updates order.status -> "cancelled"
 *   2. Updates order.payment_status -> "failed"
 *   3. Restores stock via restoreOrderStock() (atomic idempotent guard)
 *   4. Emits Socket.IO notification
 */
export const initOrderCron = () => {
  cron.schedule("* * * * *", async () => {
    if (isRunning) {
      console.log('⏰ [Cron] Previous order cron still running, skipping this tick');
      return;
    }
    isRunning = true;
    try {
      const timeLimit = new Date(Date.now() - RESERVATION_TIMEOUT_MS);

      // Find expired pending online orders (IDs only — lightweight query)
      const expiredOrders = await Order.find(
        {
          status: "pending",
          payment_method: { $in: ["vnpay", "momo"] },
          createdAt: { $lt: timeLimit },
        },
        { _id: 1 }
      ).lean();

      if (expiredOrders.length === 0) return;

      console.log(
        `⏰ [Cron] Found ${expiredOrders.length} expired pending order(s). Cancelling...`
      );

      // Process each order through the unified business flow
      for (const { _id } of expiredOrders) {
        try {
          await orderFacade.cancelExpiredOrder(_id);
          console.log(`✅ [Cron] Cancelled order ${_id}`);
        } catch (err) {
          console.error(`❌ [Cron] Failed to cancel order ${_id}:`, err.message);
        }
      }
    } catch (error) {
      console.error("❌ [Cron] Reservation timeout cron error:", error);
    } finally {
      isRunning = false;
    }
  });

  console.log(
    `⏰ [Cron] Reservation timeout job registered (every 1 min, limit: ${RESERVATION_TIMEOUT_MS / 60000} min).`
  );
};
