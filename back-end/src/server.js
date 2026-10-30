import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./configs/db.js";
import { initSocketServer } from "./sockets/index.js";
import { initEmailWorker } from "./queues/workers/email.worker.js";
import { initTrackingWorker } from "./queues/workers/tracking.worker.js";
import { initVectorSyncWorker } from "./modules/ai/queues/vectorSync.queue.js";
import { initVoucherCron } from "./cron/voucher.cron.js";
import { initOrderCron } from "./cron/order.cron.js";
import { initCampaignCron } from "./cron/campaign.cron.js";
import { createServer } from "http";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Kết nối cơ sở dữ liệu MongoDB
    await connectDB();

    // 2. Tạo server HTTP bọc ứng dụng Express
    const server = createServer(app);

    // 3. Khởi tạo Socket.IO
    initSocketServer(server);

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
