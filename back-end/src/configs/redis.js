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
    };

    if (!currentUrl) {
      config.host = currentHost;
      config.port = currentPort;
    }

    if (currentPassword && !currentUrl) {
      config.password = currentPassword;
    }
    
    redisConnection = currentUrl ? new Redis(currentUrl, config) : new Redis(config);
    
    redisConnection.on("connect", () => {
      console.log("✅ Kết nối Redis thành công");
    });
    
    redisConnection.on("error", (err) => {
      console.error("❌ Lỗi khi kết nối Redis:", err.message);
    });
  }
  return redisConnection;
};

export default getRedisConnection;
