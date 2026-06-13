import getRedisConnection from "../configs/redis.js";

/**
 * Acquire a distributed lock using Redis SETNX
 * @param {string} key - The key to lock on
 * @param {number} ttlMs - Time-to-live in milliseconds
 * @returns {Promise<boolean>} True if lock was acquired, false otherwise
 */
export const acquireLock = async (key, ttlMs = 5000) => {
  try {
    const redis = getRedisConnection();
    if (!redis) {
      console.warn("Redis is not connected, skipping lock (Warning: Race conditions possible)");
      return true; // Fallback to allow progress if Redis is not configured, but log a warning
    }
    const result = await redis.set(key, "locked", "PX", ttlMs, "NX");
    return result === "OK";
  } catch (error) {
    console.error("Redis Lock acquire error:", error.message);
    return false; 
  }
};

/**
 * Release a lock in Redis
 * @param {string} key - The key to unlock
 */
export const releaseLock = async (key) => {
  try {
    const redis = getRedisConnection();
    if (redis) {
      await redis.del(key);
    }
  } catch (error) {
    console.error("Redis Lock release error:", error.message);
  }
};
