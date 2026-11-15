import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./configs/db.js";
import { validateEnvironment } from "./configs/validateEnv.js";
import { closeRedisConnection } from "./configs/redis.js";
import inventoryReservationService from "./modules/inventory/inventoryReservation.service.js";
import { initSocketServer } from "./sockets/index.js";
import { initEmailWorker } from "./queues/workers/email.worker.js";
import { initTrackingWorker } from "./queues/workers/tracking.worker.js";
import { initVectorSyncWorker } from "./modules/ai/queues/vectorSync.queue.js";
import { initVoucherCron } from "./cron/voucher.cron.js";
import { initOrderCron } from "./cron/order.cron.js";
import { initCampaignCron } from "./cron/campaign.cron.js";
import { createServer } from "http";
import mongoose from "mongoose";

const PORT = process.env.PORT || 5000;

// Catch unhandled errors gracefully to ensure backend stability
process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ [Process] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ [Process] Uncaught Exception:", err);
});

let httpServerInstance = null;

const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 [Server] Received ${signal}. Starting graceful shutdown...`);
  if (httpServerInstance) {
    httpServerInstance.close(async () => {
      console.log("🔌 [Server] HTTP server closed.");
      try {
        await mongoose.connection.close(false);
        console.log("🗄️ [Server] MongoDB connection closed.");
        await closeRedisConnection();
        console.log("⚡ [Server] Redis connection closed.");
        process.exit(0);
      } catch (err) {
        console.error("❌ [Server] Error during teardown:", err);
        process.exit(1);
      }
    });

    // Force close after 10s timeout
    setTimeout(() => {
      console.error("⏰ [Server] Graceful shutdown timed out. Forcing exit.");
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

const startServer = async () => {
  try {
    // 0. Kiểm tra tính toàn vẹn của biến môi trường (Fail-Fast)
    validateEnvironment();

    // 1. Kết nối cơ sở dữ liệu MongoDB
    await connectDB();

    // 1.1 Phục hồi và đồng bộ trạng thái giữ hàng (Redis Inventory Reservation Recovery)
    await inventoryReservationService.reconcileReservationsFromDB().catch((err) => {
      console.warn("⚠️ Không thể đồng bộ trạng thái giữ hàng tồn kho:", err.message);
    });

    // 2. Tạo server HTTP bọc ứng dụng Express
    const server = createServer(app);
    httpServerInstance = server;

    // 3. Khởi tạo Socket.IO
    await initSocketServer(server);

    // 4. Khởi chạy hàng đợi (BullMQ Workers)
    initEmailWorker();
    initTrackingWorker();
    initVectorSyncWorker();

    // 5. Khởi động các tác vụ lập lịch (Cron Job)
    initVoucherCron();
    initOrderCron();
    initCampaignCron();

    // 6. Lắng nghe cổng kết nối
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
