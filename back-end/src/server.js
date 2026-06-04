import http from "http";
import app from "./app.js";
import { connectDB } from "./configs/db.js";
import { initSocketServer } from "./sockets/index.js";
import { initEmailWorker } from "./queues/workers/email.worker.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // 1. Kết nối cơ sở dữ liệu MongoDB
    await connectDB();

    // 2. Tạo server HTTP bọc ứng dụng Express
    const server = http.createServer(app);

    // 3. Khởi tạo Socket.IO
    initSocketServer(server);

    // 4. Khởi chạy hàng đợi (BullMQ Worker)
    initEmailWorker();

    // 5. Lắng nghe cổng kết nối
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
