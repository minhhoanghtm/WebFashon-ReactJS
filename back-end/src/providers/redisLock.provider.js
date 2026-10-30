import crypto from "crypto";
import { getRedisConnection } from "../configs/redis.js";

const RELEASE_LOCK_LUA_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
`;

/**
 * Lấy distributed lock an toàn bằng Redis SET NX PX có kèm unique token
 * @param {string} key - Khóa lock
 * @param {number} ttlMs - Thời gian sống của lock (mili giây)
 * @returns {Promise<{ acquired: boolean, token: string | null }>}
 */
export const acquireDistributedLock = async (key, ttlMs = 5000) => {
  try {
    const redis = getRedisConnection();
    if (!redis) {
      console.warn("Redis chưa được khởi tạo, bỏ qua lock (Cảnh báo: có thể xảy ra race condition)");
      return { acquired: true, token: "mock-token" };
    }
    const token = crypto.randomUUID();
    const result = await redis.set(key, token, "PX", ttlMs, "NX");
    if (result === "OK") {
      return { acquired: true, token };
    }
    return { acquired: false, token: null };
  } catch (error) {
    console.error("Lỗi acquireDistributedLock:", error.message);
    return { acquired: false, token: null };
  }
};

/**
 * Giải phóng distributed lock an toàn bằng Lua script:
 * Chỉ chủ sở hữu token tạo lock mới có quyền xóa lock, tránh xóa nhầm lock của request khác
 * @param {string} key - Khóa lock
 * @param {string} token - Token đã nhận khi acquire
 * @returns {Promise<boolean>}
 */
export const releaseDistributedLock = async (key, token) => {
  try {
    if (!token) return false;
    const redis = getRedisConnection();
    if (!redis) return true;

    const result = await redis.eval(RELEASE_LOCK_LUA_SCRIPT, 1, key, token);
    return result === 1;
  } catch (error) {
    console.error("Lỗi releaseDistributedLock:", error.message);
    return false;
  }
};

/**
 * Tương thích ngược: Acquire lock cơ bản
 */
export const acquireLock = async (key, ttlMs = 5000) => {
  const { acquired } = await acquireDistributedLock(key, ttlMs);
  return acquired;
};

/**
 * Tương thích ngược: Release lock
 */
export const releaseLock = async (key, token = null) => {
  if (token) {
    return await releaseDistributedLock(key, token);
  }
  try {
    const redis = getRedisConnection();
    if (redis) {
      await redis.del(key);
    }
    return true;
  } catch (error) {
    console.error("Lỗi releaseLock:", error.message);
    return false;
  }
};
