import getRedisConnection from "../configs/redis.js";

/**
 * Custom rate limiter middleware for claiming vouchers
 * Max 5 requests per minute per user
 */
export const claimRateLimiter = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để thực hiện chức năng này",
      });
    }

    const redis = getRedisConnection();
    if (!redis) {
      // If Redis is not connected, skip rate limiting but log a warning
      console.warn("Redis is not connected, bypassing claim rate limit");
      return next();
    }

    const key = `rate:voucher:claim:${userId}`;
    const currentRequests = await redis.incr(key);

    if (currentRequests === 1) {
      // Set expiration of 60 seconds on first request
      await redis.expire(key, 60);
    }

    if (currentRequests > 5) {
      return res.status(429).json({
        success: false,
        message: "Bạn đã thao tác quá nhanh. Vui lòng thử lại sau 1 phút.",
      });
    }

    next();
  } catch (error) {
    console.error("Rate limit middleware error:", error);
    // Proceed to next middleware to avoid blocking the application if rate limiter fails
    next();
  }
};
