import rateLimit from "express-rate-limit";

/**
 * Rate limiter cho các route auth nhạy cảm.
 *
 * - signIn / signUp: 10 request / 15 phút mỗi IP → chống brute-force.
 * - sendOTP:          5 request / 15 phút mỗi IP → chống spam OTP.
 * - verify-otp:      10 request / 15 phút mỗi IP → chống brute-force OTP.
 * - resetPassword:    5 request / 15 phút mỗi IP → chống brute-force.
 * - global auth:     100 request / 15 phút mỗi IP → chống DDoS toàn bộ /auth.
 */

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Trả về RateLimit-* headers (draft-6)
    legacyHeaders: false,  // Tắt X-RateLimit-* cũ
    message: {
      status: 429,
      message,
    },
  });

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
