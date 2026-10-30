import getRedisConnection from "../src/configs/redis.js";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
  try {
    const redis = getRedisConnection();
    if (redis) {
      await redis.del("vouchers:public");
      console.log("✅ Đã xóa cache vouchers:public trong Redis!");
    } else {
      console.log("❌ Không kết nối được Redis");
    }
  } catch (err) {
    console.error("❌ Lỗi xóa cache Redis:", err.message);
  } finally {
    process.exit(0);
  }
};

run();
