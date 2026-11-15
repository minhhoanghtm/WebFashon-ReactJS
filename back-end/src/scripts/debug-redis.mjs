import getRedisConnection from "../configs/redis.js";

async function main() {
  const redis = getRedisConnection();
  const keys = await redis.keys("webfashion:*");
  console.log("Found keys:", keys.length);
  for (const k of keys) {
    const type = await redis.type(k);
    if (type === "string") {
      const val = await redis.get(k);
      console.log(`${k} (${type}):`, val.length > 100 ? val.substring(0, 100) + "..." : val);
    } else if (type === "zset") {
      const val = await redis.zrange(k, 0, -1, "WITHSCORES");
      console.log(`${k} (${type}):`, val);
    } else if (type === "set") {
      const val = await redis.smembers(k);
      console.log(`${k} (${type}):`, val);
    }
  }
  process.exit(0);
}

main().catch(console.error);

