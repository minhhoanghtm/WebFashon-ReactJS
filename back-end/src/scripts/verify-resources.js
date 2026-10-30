import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import { getRedisConnection } from "../configs/redis.js";

async function verifyResources() {
  console.log("================================================================================");
  console.log("🛡️ RESOURCE VERIFICATION & ISOLATION CHECK: REACT-WebFashion");
  console.log("================================================================================");

  await connectDB();
  const redis = getRedisConnection();
  let redisPing = "DISCONNECTED";
  let redisDbSize = 0;
  if (redis) {
    try {
      redisPing = await redis.ping();
      redisDbSize = await redis.dbsize();
    } catch (e) {
      redisPing = e.message;
    }
  }

  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name).sort();

  console.log("MongoDB Connection:");
  console.log("  - Host:", mongoose.connection.host);
  console.log("  - Database Name:", mongoose.connection.name);
  console.log("  - ReadyState:", mongoose.connection.readyState, "(1 = Connected)");
  console.log("  - Total Collections:", collectionNames.length);
  console.log("  - Collections:", collectionNames.join(", "));

  console.log("\nRedis Connection:");
  console.log("  - Ping:", redisPing);
  console.log("  - DB Size (Total Keys):", redisDbSize);
  if (redis) {
    const keys = await redis.keys("*");
    const prefixes = {};
    keys.forEach((k) => {
      const p = k.split(":")[0] || "other";
      prefixes[p] = (prefixes[p] || 0) + 1;
    });
    console.log("  - Key Prefixes distribution:", prefixes);
  }

  console.log("\nEnvironment Settings:");
  console.log("  - APP_ENV:", process.env.APP_ENV || process.env.NODE_ENV || "development");
  console.log("  - PORT:", process.env.PORT || 5000);
  console.log("  - ACTIVE_REC_EXPERIMENT_ID:", process.env.ACTIVE_REC_EXPERIMENT_ID);

  if (redis) await redis.quit();
  await mongoose.disconnect();
}

verifyResources().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
