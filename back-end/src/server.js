import app from "./app.js";
import { connectDB } from "./configs/db.js";
import { initSocketServer } from "./sockets/index.js";
import { initEmailWorker } from "./queues/workers/email.worker.js";
import { initVoucherCron } from "./cron/voucher.cron.js";
import { initOrderCron } from "./cron/order.cron.js";
import { createServer } from "http";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT;

const startServer = async () => {
  try {
    // 1. Kết nối cơ sở dữ liệu MongoDB
    await connectDB();

    // 2. Tạo server HTTP bọc ứng dụng Express
    const server = createServer(app);

    // 3. Khởi tạo Socket.IO
    initSocketServer(server);

    // 4. Khởi chạy hàng đợi (BullMQ Worker)
    initEmailWorker();

    // 5. Khởi động các tác vụ lập lịch (Cron Job)
    initVoucherCron();
    initOrderCron();

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

