// check_redis.js
import getRedisConnection from './src/configs/redis.js';

async function inspectPattern(redis, pattern) {
  const keys = await redis.keys(pattern);
  console.log(`Pattern '${pattern}' -> ${keys.length} keys`);
  if (keys.length > 0) {
    console.log('  Sample keys:', keys.slice(0, 5));
  }
}

async function main() {
  try {
    const redis = getRedisConnection();
    if (redis.status !== 'ready') {
      await new Promise((res) => redis.once('ready', res));
    }
    console.log('Redis ping:', await redis.ping());
    await inspectPattern(redis, 'products*');
    await inspectPattern(redis, 'auth:access:*');
    await inspectPattern(redis, 'auth:blacklist:*');
    await inspectPattern(redis, 'auth:refresh:*');
    await inspectPattern(redis, 'at:*');
    await inspectPattern(redis, 'sess:*');
    await inspectPattern(redis, '*rate*');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}

main();
