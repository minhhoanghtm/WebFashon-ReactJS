import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

let redisConnection = null;

export const getRedisConnection = () => {
  if (!redisConnection) {
    const currentUrl = process.env.REDIS_URL;
    const currentHost = process.env.REDIS_HOST || "127.0.0.1";
    const currentPort = parseInt(process.env.REDIS_PORT || "6379", 10);
    const currentPassword = process.env.REDIS_PASSWORD || undefined;

    const config = {
      maxRetriesPerRequest: null, // Critical for BullMQ
      enableOfflineQueue: process.env.NODE_ENV === "test" ? true : false, // Prevents offline commands from hanging backend requests in production
      connectTimeout: 2000,
    };

    // Jest suites use the locally available Redis but must never retain retry
    // timers or a referenced socket after a suite has finished.
    if (process.env.NODE_ENV === "test") {
      config.retryStrategy = () => null;
    }

    if (!currentUrl) {
      config.host = currentHost;
      config.port = currentPort;
    }

    if (currentPassword && !currentUrl) {
      config.password = currentPassword;
    }
    
    redisConnection = currentUrl ? new Redis(currentUrl, config) : new Redis(config);
    const connection = redisConnection;
    
    connection.on("connect", () => {
      if (process.env.NODE_ENV === "test") {
        connection.connector?.stream?.unref?.();
        return;
      }
      console.log("✅ Kết nối Redis thành công");
    });
    
    connection.on("error", (err) => {
      console.error("❌ Lỗi khi kết nối Redis:", err.message);
    });
  }
  return redisConnection;
};

export const closeRedisConnection = async () => {
  if (!redisConnection) return;
  const connection = redisConnection;
  redisConnection = null;
  await connection.quit().catch(() => connection.disconnect());
};

export default getRedisConnection;
