import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

let redisConnection = null;

export const getRedisConnection = () => {
  if (!redisConnection) {
    const config = {
      maxRetriesPerRequest: null, // Critical for BullMQ
    };

    if (!redisUrl) {
      config.host = redisHost;
      config.port = redisPort;
    }

    if (redisPassword && !redisUrl) {
      config.password = redisPassword;
    }
    
    redisConnection = redisUrl ? new Redis(redisUrl, config) : new Redis(config);
    
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
