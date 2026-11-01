import crypto from "crypto";
import getRedisConnection from "../../configs/redis.js";
import { AppError } from "../../common/exceptions/AppError.js";

const redis = getRedisConnection();

const OTP_SECRET = process.env.OTP_SECRET || "webfashion_otp_hmac_secret_2026";
const OTP_TTL_SECONDS = parseInt(process.env.OTP_TTL_SECONDS, 10) || 300; // 5 minutes
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5;
const OTP_COOLDOWN_SECONDS = parseInt(process.env.OTP_COOLDOWN_SECONDS, 10) || 60; // 60s
const OTP_HOURLY_LIMIT_IDENTIFIER = 5;
const OTP_HOURLY_LIMIT_IP = 20;

// In-memory fallback if Redis is unavailable in certain test environments
const memoryStore = new Map();

class OtpService {
  /**
   * Secure 6-digit OTP generator using crypto.randomInt
   */
  generateOtp() {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Hash OTP using HMAC-SHA256
   */
  hashOtp(otp, identifier, purpose) {
    return crypto
      .createHmac("sha256", OTP_SECRET)
      .update(`${identifier}:${purpose}:${otp}`)
      .digest("hex");
  }

  /**
   * Build Redis key for OTP
   */
  getOtpKey(identifier, purpose) {
    return `otp:${purpose}:${identifier}`;
  }

  getCooldownKey(identifier, purpose) {
    return `otp_cd:${purpose}:${identifier}`;
  }

  getHourlyIdentifierKey(identifier) {
    return `otp_rate:id:${identifier}`;
  }

  getHourlyIpKey(ip) {
    return `otp_rate:ip:${ip || "unknown"}`;
  }

  /**
   * Check cooldown and hourly rate limits before generating OTP
   */
  async checkRateLimits(identifier, purpose, ip = null) {
    const cdKey = this.getCooldownKey(identifier, purpose);
    const idRateKey = this.getHourlyIdentifierKey(identifier);
    const ipRateKey = this.getHourlyIpKey(ip);

    try {
      // 1. Check 60s cooldown
      const remainingCooldown = await redis.ttl(cdKey);
      if (remainingCooldown > 0) {
        const err = new AppError(
          `Vui lòng chờ ${remainingCooldown} giây trước khi yêu cầu mã OTP mới.`,
          429
        );
        err.code = "COOLDOWN_ACTIVE";
        err.remainingSeconds = remainingCooldown;
        throw err;
      }

      // 2. Check hourly limit per identifier (phone/email)
      const idCount = await redis.get(idRateKey);
      if (idCount && parseInt(idCount, 10) >= OTP_HOURLY_LIMIT_IDENTIFIER) {
        const ttl = await redis.ttl(idRateKey);
        const err = new AppError(
          `Bạn đã vượt quá giới hạn 5 mã OTP/giờ. Vui lòng thử lại sau ${Math.ceil(ttl / 60)} phút.`,
          429
        );
        err.code = "RATE_LIMITED";
        err.remainingSeconds = ttl;
        throw err;
      }

      // 3. Check hourly limit per IP
      if (ip) {
        const ipCount = await redis.get(ipRateKey);
        if (ipCount && parseInt(ipCount, 10) >= ((ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || process.env.NODE_ENV !== 'production') ? OTP_HOURLY_LIMIT_IP * 50 : OTP_HOURLY_LIMIT_IP)) {
          const ttl = await redis.ttl(ipRateKey);
          const err = new AppError(
            `Quá nhiều yêu cầu OTP từ địa chỉ IP này. Vui lòng thử lại sau ${Math.ceil(ttl / 60)} phút.`,
            429
          );
          err.code = "RATE_LIMITED";
          err.remainingSeconds = ttl;
          throw err;
        }
      }
    } catch (err) {
      if (err.isOperational) throw err;
      // If Redis has temporary connection issue, fall back to memoryStore
      this.checkMemoryRateLimits(identifier, purpose, ip);
    }
  }

  checkMemoryRateLimits(identifier, purpose, ip) {
    const now = Date.now();
    const cdKey = this.getCooldownKey(identifier, purpose);
    const cd = memoryStore.get(cdKey);
    if (cd && cd > now) {
      const remainingSeconds = Math.ceil((cd - now) / 1000);
      const err = new AppError(
        `Vui lòng chờ ${remainingSeconds} giây trước khi yêu cầu mã OTP mới.`,
        429
      );
      err.code = "COOLDOWN_ACTIVE";
      err.remainingSeconds = remainingSeconds;
      throw err;
    }
  }

  /**
   * Create and store a new secure hashed OTP
   * Invalidates any previously active OTP for this identifier + purpose
   */
  async createAndStoreOtp(identifier, purpose, ip = null) {
    await this.checkRateLimits(identifier, purpose, ip);

    const rawOtp = this.generateOtp();
    const hashedOtp = this.hashOtp(rawOtp, identifier, purpose);

    const otpData = {
      hash: hashedOtp,
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      createdAt: Date.now(),
    };

    const otpKey = this.getOtpKey(identifier, purpose);
    const cdKey = this.getCooldownKey(identifier, purpose);
    const idRateKey = this.getHourlyIdentifierKey(identifier);
    const ipRateKey = this.getHourlyIpKey(ip);

    try {
      const pipeline = redis.pipeline();
      // Store OTP with 5 min TTL
      pipeline.set(otpKey, JSON.stringify(otpData), "EX", OTP_TTL_SECONDS);
      // Set 60s cooldown
      pipeline.set(cdKey, "1", "EX", OTP_COOLDOWN_SECONDS);

      // Increment hourly counts
      pipeline.incr(idRateKey);
      pipeline.expire(idRateKey, 3600);

      if (ip) {
        pipeline.incr(ipRateKey);
        pipeline.expire(ipRateKey, 3600);
      }

      await pipeline.exec();
    } catch (err) {
      // Memory fallback
      memoryStore.set(otpKey, { ...otpData, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000 });
      memoryStore.set(cdKey, Date.now() + OTP_COOLDOWN_SECONDS * 1000);
    }

    return {
      otp: rawOtp,
      ttl: OTP_TTL_SECONDS,
      cooldown: OTP_COOLDOWN_SECONDS,
    };
  }

  /**
   * Verify provided OTP using timing-safe compare
   * Enforces max wrong attempts and single-use invalidation
   */
  async verifyOtp(identifier, purpose, enteredOtp) {
    if (!enteredOtp || typeof enteredOtp !== "string") {
      const err = new AppError("Vui lòng nhập mã OTP.", 400);
      err.code = "OTP_INVALID";
      throw err;
    }

    const cleanEntered = enteredOtp.trim();
    if (!/^\d{6}$/.test(cleanEntered)) {
      const err = new AppError("Mã OTP phải gồm đúng 6 chữ số.", 422);
      err.code = "OTP_INVALID_FORMAT";
      throw err;
    }

    const otpKey = this.getOtpKey(identifier, purpose);
    let otpRecord = null;

    try {
      const raw = await redis.get(otpKey);
      if (raw) otpRecord = JSON.parse(raw);
    } catch (err) {
      // Memory fallback
      otpRecord = memoryStore.get(otpKey);
      if (otpRecord && otpRecord.expiresAt < Date.now()) {
        memoryStore.delete(otpKey);
        otpRecord = null;
      }
    }

    if (!otpRecord) {
      const err = new AppError(
        "Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu mã mới.",
        400
      );
      err.code = "OTP_EXPIRED";
      throw err;
    }

    // Check attempts limit
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await this.deleteOtp(identifier, purpose);
      const err = new AppError(
        "Bạn đã nhập sai OTP quá 5 lần. Mã đã bị hủy, vui lòng yêu cầu mã mới.",
        400
      );
      err.code = "OTP_TOO_MANY_ATTEMPTS";
      throw err;
    }

    // Compute hash of entered OTP
    const enteredHash = this.hashOtp(cleanEntered, identifier, purpose);

    // Timing-safe comparison
    const expectedBuffer = Buffer.from(otpRecord.hash, "hex");
    const enteredBuffer = Buffer.from(enteredHash, "hex");

    const isMatch =
      expectedBuffer.length === enteredBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, enteredBuffer);

    if (!isMatch) {
      otpRecord.attempts += 1;
      const remainingAttempts = otpRecord.maxAttempts - otpRecord.attempts;

      if (remainingAttempts <= 0) {
        await this.deleteOtp(identifier, purpose);
        const err = new AppError(
          "Bạn đã nhập sai OTP quá 5 lần. Mã đã bị hủy, vui lòng yêu cầu mã mới.",
          400
        );
        err.code = "OTP_TOO_MANY_ATTEMPTS";
        throw err;
      } else {
        // Update attempts with remaining TTL
        try {
          const remainingTtl = await redis.ttl(otpKey);
          if (remainingTtl > 0) {
            await redis.set(otpKey, JSON.stringify(otpRecord), "EX", remainingTtl);
          }
        } catch {
          memoryStore.set(otpKey, otpRecord);
        }

        const err = new AppError(
          `Mã OTP không chính xác. Bạn còn ${remainingAttempts} lần thử.`,
          400
        );
        err.code = "OTP_INVALID";
        err.remainingAttempts = remainingAttempts;
        throw err;
      }
    }

    // Match! Consume OTP immediately (single use)
    await this.deleteOtp(identifier, purpose);
    return true;
  }

  /**
   * Delete OTP key immediately
   */
  async deleteOtp(identifier, purpose, clearCooldown = false) {
    const otpKey = this.getOtpKey(identifier, purpose);
    try {
      if (clearCooldown) await redis.del(otpKey, this.getCooldownKey(identifier, purpose)); else await redis.del(otpKey);
    } catch {
      memoryStore.delete(otpKey);
    }
  }
}

export default new OtpService();
