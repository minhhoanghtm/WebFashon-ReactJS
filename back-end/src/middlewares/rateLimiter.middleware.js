import rateLimit from "express-rate-limit";
import { getRedisConnection } from "../configs/redis.js";
// Environment flag to bypass rate limiting strictly during isolated unit tests (NODE_ENV=test)
const DISABLE_RATE_LIMIT_FOR_TESTS =
  process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMIT_FOR_TESTS === "true";

/**
 * Rate limiter cho các route auth nhạy cảm.
 *
 * - signIn / signUp: 10 request / 15 phút mỗi IP → chống brute-force.
 * - sendOTP:          5 request / 15 phút mỗi IP → chống spam OTP.
 * - verify-otp:      10 request / 15 phút mỗi IP → chống brute-force OTP.
 * - resetPassword:    5 request / 15 phút mỗi IP → chống brute-force.
 * - global auth:     100 request / 15 phút mỗi IP → chống DDoS toàn bộ /auth.
 * - events tracking: 120 request / 1 phút mỗi IP → chống spam tracking.
 */

const createLimiter = (windowMs, max, message) => {
  if (DISABLE_RATE_LIMIT_FOR_TESTS) {
    return (req, res, next) => next();
  }
  return rateLimit({
    windowMs,
    max: (process.env.NODE_ENV === 'production' ? max : Math.max(max * 50, 300)),
    standardHeaders: true, // Trả về RateLimit-* headers (draft-6)
    legacyHeaders: false,  // Tắt X-RateLimit-* cũ
    message: {
      status: 429,
      message,
    },
  });
};

// ──────────────────────────────────────────────
// Route-level limiters
// ──────────────────────────────────────────────

/** /auth/signIn — 10 req / 15 min */
export const signInLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  "Bạn đã đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.",
);

/** /auth/signUp — 10 req / 15 min */
export const signUpLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  "Bạn đã đăng ký quá nhiều lần. Vui lòng thử lại sau 15 phút.",
);

/** /auth/sendOTP — 5 req / 15 min (tighter — OTP gửi SMS/email tốn chi phí) */
export const sendOtpLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  "Bạn đã gửi OTP quá nhiều lần. Vui lòng thử lại sau 15 phút.",
);

/** /auth/verify-otp — 10 req / 15 min */
export const verifyOtpLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  "Bạn đã xác minh OTP quá nhiều lần. Vui lòng thử lại sau 15 phút.",
);

/** Re-authentication before a personal-data export or deletion request. */
export const dataSubjectRequestLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  "Bạn đã xác thực dữ liệu quá nhiều lần. Vui lòng thử lại sau 15 phút.",
);

/** /auth/resetPassword — 5 req / 15 min */
export const resetPasswordLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  "Bạn đã đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.",
);

/** Áp cho toàn bộ /auth — 100 req / 15 min (lưới an toàn chống DDoS) */
export const authGlobalLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  "Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau.",
);

/** /events — 120 req / 1 min (chống spam tracking theo IP và anonymous_id/userId) */
export const eventTrackingLimiter = DISABLE_RATE_LIMIT_FOR_TESTS
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      keyGenerator: (req) => {
        const anonId = req.headers["x-anonymous-id"] || req.body?.anonymous_id;
        const userOrAnon = req.user?.userId || anonId || "guest";
        return `${req.ip}:${userOrAnon}`;
      },
      validate: false,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        status: 429,
        message: "Quá nhiều sự kiện ghi nhận. Vui lòng thử lại sau 1 phút.",
      },
    });

/**
 * /chat/ai/send — 30 requests/minute for each signed-in user and each guest IP.
 * Auth is optional on this endpoint, therefore guests must never share a global
 * bucket; their IP is their identity.
 */
export const createAiChatLimiter = ({ windowMs = 60 * 1000, max = 30 } = {}) =>
  rateLimit({
      windowMs,
      max,
      keyGenerator: (req) => req.user?.userId ? `user:${req.user.userId}:ip:${req.ip}` : `ip:${req.ip}`,
      validate: false,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        status: 429,
        message: "Bạn đã gửi quá nhiều tin nhắn cho AI. Vui lòng thử lại sau 1 phút.",
      },
    });

export const aiChatLimiter = DISABLE_RATE_LIMIT_FOR_TESTS
  ? (req, res, next) => next()
  : createAiChatLimiter();

const AI_CHAT_DAILY_QUOTA = Number.parseInt(process.env.AI_CHAT_DAILY_QUOTA || "200", 10);
const ONE_DAY_SECONDS = 24 * 60 * 60;

export const createAiChatDailyQuota = ({
  redisProvider = getRedisConnection,
  quota = AI_CHAT_DAILY_QUOTA,
} = {}) => async (req, res, next) => {
  const identity = req.user?.userId
    ? `user:${req.user.userId}:ip:${req.ip}`
    : `ip:${req.ip}`;
  const key = `rate-limit:ai-chat:daily:${identity}`;

  try {
    const redis = redisProvider();
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, ONE_DAY_SECONDS);
    }

    if (count > quota) {
      return res.status(429).json({
        success: false,
        message: "Bạn đã dùng hết lượt chat AI hôm nay. Vui lòng quay lại sau.",
        code: "AI_CHAT_DAILY_QUOTA_EXCEEDED",
      });
    }

    return next();
  } catch (error) {
    // Do not silently bypass a cost-control mechanism when Redis is unavailable.
    return res.status(503).json({
      success: false,
      message: "Dịch vụ chat AI đang tạm thời bận. Vui lòng thử lại sau.",
      code: "AI_CHAT_QUOTA_UNAVAILABLE",
    });
  }
};

/** Redis-backed daily quota. Kept enabled in tests so the quota is testable. */
export const aiChatDailyQuota = createAiChatDailyQuota();
