import userRepository from "../users/user.repository.js";
import authRepository from "./auth.repository.js";
import { AppError } from "../../common/exceptions/AppError.js";
import { normalizeEmail } from "../../common/utils/normalizeEmail.js";
import { generateOTP } from "../../common/helpers/generateOTP.js";
import { addEmailJob } from "../../queues/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import getRedisConnection from "../../configs/redis.js";
import logger from "../../common/logger.js";
import googleAuth from "google-auth-library";
import otpService from "./otp.service.js";
import smsService from "../sms/sms.service.js";
import {
  isValidVietnamesePhone,
  normalizeVietnamesePhone,
  maskPhone,
} from "../../common/utils/phone.js";
import { validatePasswordStrength } from "../../common/utils/password.js";

const { OAuth2Client } = googleAuth;
dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const redis = getRedisConnection();
const ACCESS_TOKEN_TTL = "30m";
const ACCESS_TOKEN_REDIS_TTL = 30 * 60; // 30 minutes in seconds
const REFRESH_TOKEN_REDIS_TTL = 14 * 24 * 60 * 60; // 14 days in seconds

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

class AuthService {
  /**
   * Helper to issue JWT, refresh token and persist session in Redis
   */
  async issueAuthSession(user, ip = null, ua = null) {
    const jti = crypto.randomUUID();
    const accessToken = jwt.sign(
      { userId: user._id || user.id, jti },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const refreshToken = crypto.randomBytes(60).toString("hex");
    const hashedRt = hashToken(refreshToken);

    const sessionKey = `sess:${user._id || user.id}:${jti}`;
    const sessionData = {
      refreshToken: hashedRt,
      ip,
      ua,
      createdAt: new Date().toISOString(),
    };

    // Store in Redis
    await redis.set(sessionKey, JSON.stringify(sessionData), "EX", REFRESH_TOKEN_REDIS_TTL);
    await redis.set(`rt:${hashedRt}`, sessionKey, "EX", REFRESH_TOKEN_REDIS_TTL);
    await redis.set(`at:${jti}`, String(user._id || user.id), "EX", ACCESS_TOKEN_REDIS_TTL);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id || user.id,
        email: user.email || null,
        phone: user.phone || null,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Registration Flow (Email & Phone SMS OTP)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Legacy / Email-based Sign Up (Backwards Compatible)
   */
  async signUp(userData) {
    const { passWord, lastName, firstName, email, phone, birthday, sex } = userData;

    if (!passWord || (!lastName && !firstName && !userData.fullName)) {
      throw new AppError("Không thể thiếu mật khẩu và họ tên!", 400);
    }

    const pwValidation = validatePasswordStrength(passWord);
    if (!pwValidation.isValid) {
      throw new AppError(pwValidation.message, 422);
    }

    let normalizedEmail = null;
    if (email) {
      normalizedEmail = normalizeEmail(email);
      const emailExists = await userRepository.findByEmail(normalizedEmail);
      if (emailExists) {
        throw new AppError("Email đã tồn tại!", 409);
      }
    }

    let normPhone = null;
    if (phone) {
      if (!isValidVietnamesePhone(phone)) {
        throw new AppError("Số điện thoại không hợp lệ.", 422);
      }
      normPhone = normalizeVietnamesePhone(phone);
      const phoneExists = await userRepository.findByPhone(normPhone);
      if (phoneExists) {
        throw new AppError("Số điện thoại đã tồn tại!", 409);
      }
    }

    if (!normalizedEmail && !normPhone) {
      throw new AppError("Vui lòng cung cấp địa chỉ email hoặc số điện thoại.", 400);
    }

    const fullName = userData.fullName || `${lastName || ""} ${firstName || ""}`.trim();
    const hashedPass = await bcrypt.hash(passWord, 10);
    const newUser = await userRepository.create({
      passWord: hashedPass,
      fullName,
      email: normalizedEmail,
      phone: normPhone,
      ...(birthday && { birthday: new Date(birthday) }),
      ...(sex && { sex }),
    });

    return {
      id: newUser._id,
      email: newUser.email,
      phone: newUser.phone,
      fullName: newUser.fullName,
    };
  }

  /**
   * Send Registration OTP via SMS
   */
  async sendRegisterOtp(phone, channel = "sms", ip = null) {
    if (!phone) {
      throw new AppError("Vui lòng nhập số điện thoại.", 422);
    }
    if (!isValidVietnamesePhone(phone)) {
      const err = new AppError("Số điện thoại không đúng định dạng di động Việt Nam.", 422);
      err.code = "INVALID_PHONE_FORMAT";
      throw err;
    }

    const normPhone = normalizeVietnamesePhone(phone);
    const existing = await userRepository.findByPhone(normPhone);
    if (existing) {
      const err = new AppError("Số điện thoại này đã được đăng ký tài khoản.", 409);
      err.code = "PHONE_EXISTS";
      throw err;
    }

    // Generate & store OTP (with 60s cooldown & hourly limits)
    const { otp, cooldown, ttl } = await otpService.createAndStoreOtp(
      normPhone,
      "register",
      ip
    );

    // Send SMS via configured provider (with email fallback if any)
    const sendResult = await smsService.sendOtpWithFallback({
      phone: normPhone,
      otp,
      purpose: "register",
    });

    if (!sendResult.success) {
      throw new AppError(sendResult.error || "Không thể gửi SMS OTP.", 500);
    }

    return {
      phone: maskPhone(normPhone),
      rawPhone: normPhone,
      cooldown,
      ttl,
      channel: sendResult.channel,
      message: sendResult.message,
    };
  }

  /**
   * Verify Registration OTP and create user
   */
  async verifyRegisterAndCreateUser(data, ip = null, ua = null) {
    const { phone, otp, fullName, passWord, email, birthday, sex } = data;

    if (!phone || !otp || !fullName || !passWord) {
      throw new AppError("Thiếu thông tin đăng ký bắt buộc.", 400);
    }

    if (!isValidVietnamesePhone(phone)) {
      throw new AppError("Số điện thoại không đúng định dạng.", 422);
    }
    const normPhone = normalizeVietnamesePhone(phone);

    // Verify OTP (throws if invalid, expired, or too many attempts)
    await otpService.verifyOtp(normPhone, "register", otp);

    // Verify password strength
    const pwCheck = validatePasswordStrength(passWord);
    if (!pwCheck.isValid) {
      throw new AppError(pwCheck.message, 422);
    }

    // Check phone uniqueness again
    const phoneExists = await userRepository.findByPhone(normPhone);
    if (phoneExists) {
      const err = new AppError("Số điện thoại này đã được đăng ký tài khoản.", 409);
      err.code = "PHONE_EXISTS";
      throw err;
    }

    // Optional email check
    let normalizedEmail = null;
    if (email && email.trim()) {
      normalizedEmail = normalizeEmail(email);
      const emailExists = await userRepository.findByEmail(normalizedEmail);
      if (emailExists) {
        const err = new AppError("Địa chỉ email này đã tồn tại trong hệ thống.", 409);
        err.code = "EMAIL_EXISTS";
        throw err;
      }
    }

    const hashedPass = await bcrypt.hash(passWord, 10);
    const newUser = await userRepository.create({
      phone: normPhone,
      email: normalizedEmail,
      fullName: fullName.trim(),
      passWord: hashedPass,
      role: "user",
      status: "active",
      ...(birthday && { birthday: new Date(birthday) }),
      ...(sex && { sex }),
    });

    // Auto login: issue session & tokens
    return await this.issueAuthSession(newUser, ip, ua);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Login Flow (Password: Email / Phone + OTP Login)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Universal Sign In by Email OR Phone + Password
   */
  async signIn(emailOrPhone, passWord, ip = null, ua = null) {
    if (!emailOrPhone || !passWord) {
      throw new AppError("Thiếu thông tin đăng nhập hoặc mật khẩu.", 400);
    }

    const cleanInput = String(emailOrPhone).trim();
    let user = null;

    if (isValidVietnamesePhone(cleanInput)) {
      const normPhone = normalizeVietnamesePhone(cleanInput);
      user = await userRepository.findByPhone(normPhone);
    } else {
      const normalizedEmail = normalizeEmail(cleanInput);
      user = await userRepository.findByEmail(normalizedEmail);
    }

    if (!user) {
      throw new AppError("Email, số điện thoại hoặc mật khẩu không chính xác.", 401);
    }

    if (user.status === "blocked") {
      const err = new AppError("Tài khoản của bạn đã bị khóa.", 403);
      err.code = "ACCOUNT_BLOCKED";
      throw err;
    }

    // Temporary lock check (Redis)
    const lockKey = `login:lock:${user._id}`;
    const isLocked = await redis.exists(lockKey);
    if (isLocked) {
      const ttl = await redis.ttl(lockKey);
      const err = new AppError(`Tài khoản bị khóa tạm thời do nhập sai nhiều lần. Vui lòng thử lại sau ${ttl} giây.`, 403);
      err.code = "ACCOUNT_LOCKED_TEMPORARILY";
      err.remainingSeconds = ttl;
      throw err;
    }

    // Verify password
    const passWordCorrect = await bcrypt.compare(passWord, user.passWord);
    if (!passWordCorrect) {
      const failKey = `login:fail:${user._id}`;
      const attempts = await redis.incr(failKey);
      await redis.expire(failKey, 30 * 60);

      let lockTtl = 0;
      if (attempts >= 10) lockTtl = 60 * 60; // 1 hour
      else if (attempts >= 5) lockTtl = 60;   // 1 minute
      else if (attempts >= 3) lockTtl = 30;   // 30 seconds

      if (lockTtl > 0) {
        await redis.set(lockKey, "1", "EX", lockTtl);
        await redis.del(failKey);
        logger.warn(`User ${user._id} locked for ${lockTtl}s after ${attempts} failed attempts`);
        const err = new AppError(`Quá giới hạn đăng nhập sai. Tài khoản bị khóa tạm thời ${lockTtl} giây.`, 403);
        err.code = "ACCOUNT_LOCKED_TEMPORARILY";
        err.remainingSeconds = lockTtl;
        throw err;
      }

      logger.warn(`Failed login attempt ${attempts} for user ${user._id}`);
      throw new AppError("Email, số điện thoại hoặc mật khẩu không chính xác.", 401);
    }

    // Successful login – reset fail counter
    await redis.del(`login:fail:${user._id}`);
    await redis.del(lockKey);

    return await this.issueAuthSession(user, ip, ua);
  }

  /**
   * Send Login OTP (Passwordless Login via SMS)
   */
  async sendLoginOtp(phone, ip = null) {
    if (!phone || !isValidVietnamesePhone(phone)) {
      throw new AppError("Số điện thoại không đúng định dạng di động Việt Nam.", 422);
    }

    const normPhone = normalizeVietnamesePhone(phone);
    const user = await userRepository.findByPhone(normPhone);

    if (!user) {
      const err = new AppError("Số điện thoại này chưa được đăng ký trong hệ thống.", 404);
      err.code = "PHONE_NOT_FOUND";
      throw err;
    }

    if (user.status === "blocked") {
      const err = new AppError("Tài khoản của bạn đã bị khóa.", 403);
      err.code = "ACCOUNT_BLOCKED";
      throw err;
    }

    const { otp, cooldown, ttl } = await otpService.createAndStoreOtp(
      normPhone,
      "login",
      ip
    );

    const sendResult = await smsService.sendOtpWithFallback({
      phone: normPhone,
      email: user.email,
      otp,
      purpose: "login",
    });

    if (!sendResult.success) {
      throw new AppError(sendResult.error || "Không thể gửi SMS OTP đăng nhập.", 500);
    }

    return {
      phone: maskPhone(normPhone),
      cooldown,
      ttl,
      channel: sendResult.channel,
      message: sendResult.message,
    };
  }

  /**
   * Verify Login OTP and sign in
   */
  async verifyLoginOtp(phone, otp, ip = null, ua = null) {
    if (!phone || !otp) {
      throw new AppError("Vui lòng cung cấp số điện thoại và mã OTP.", 400);
    }

    const normPhone = normalizeVietnamesePhone(phone);
    await otpService.verifyOtp(normPhone, "login", otp);

    const user = await userRepository.findByPhone(normPhone);
    if (!user) {
      throw new AppError("Không tìm thấy người dùng.", 404);
    }

    if (user.status === "blocked") {
      throw new AppError("Tài khoản của bạn đã bị khóa.", 403);
    }

    return await this.issueAuthSession(user, ip, ua);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Forgot / Reset Password Flow (Anti-Account Enumeration)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Send Reset Password OTP
   * Anti-enumeration: returns generic 200 message regardless of whether identifier exists
   */
  async sendForgotPasswordOtp(identifier, channel = "auto", ip = null) {
    if (!identifier || typeof identifier !== "string") {
      throw new AppError("Vui lòng nhập số điện thoại hoặc địa chỉ email.", 400);
    }

    const cleanInput = identifier.trim();
    const isPhone = isValidVietnamesePhone(cleanInput);
    let normIdentifier = "";
    let user = null;

    if (isPhone) {
      normIdentifier = normalizeVietnamesePhone(cleanInput);
      user = await userRepository.findByPhone(normIdentifier);
    } else {
      normIdentifier = normalizeEmail(cleanInput);
      user = await userRepository.findByEmail(normIdentifier);
    }

    const genericSuccess = {
      success: true,
      message: "Nếu thông tin tài khoản hợp lệ, mã OTP khôi phục mật khẩu đã được gửi.",
      data: {
        identifier: isPhone ? maskPhone(normIdentifier) : normIdentifier,
        cooldown: 60,
        channel: isPhone ? "sms" : "email",
      },
    };

    // Anti-account enumeration: User does not exist, return generic message without error
    if (!user) {
      logger.info(`Forgot password requested for non-existent identifier: ${maskPhone(cleanInput)}`);
      return genericSuccess;
    }

    if (user.status === "blocked") {
      return genericSuccess; // Still return generic message to avoid leaking status
    }

    // User exists -> generate and send OTP
    const { otp, cooldown } = await otpService.createAndStoreOtp(
      normIdentifier,
      "reset_password",
      ip
    );

    if (isPhone) {
      await smsService.sendOtpWithFallback({
        phone: normIdentifier,
        email: user.email,
        otp,
        purpose: "reset_password",
      });
    } else {
      await addEmailJob(normIdentifier, otp);
    }

    genericSuccess.data.cooldown = cooldown;
    return genericSuccess;
  }

  /**
   * Reset Password with OTP & Invalidate All Existing Sessions
   */
  async resetPasswordWithOtp(identifier, otp, newPassword) {
    if (!identifier || !otp || !newPassword) {
      throw new AppError("Thiếu thông tin để đặt lại mật khẩu.", 400);
    }

    const cleanInput = identifier.trim();
    const isPhone = isValidVietnamesePhone(cleanInput);
    const normIdentifier = isPhone
      ? normalizeVietnamesePhone(cleanInput)
      : normalizeEmail(cleanInput);

    // Verify OTP first
    await otpService.verifyOtp(normIdentifier, "reset_password", otp);

    // Validate new password strength
    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.isValid) {
      throw new AppError(pwCheck.message, 422);
    }

    // Find user
    const user = isPhone
      ? await userRepository.findByPhone(normIdentifier)
      : await userRepository.findByEmail(normIdentifier);

    if (!user) {
      throw new AppError("Không tìm thấy thông tin tài khoản.", 404);
    }

    // Hash and update password
    user.passWord = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Revoke all existing sessions and refresh tokens across all devices
    await this.signOutAll(user._id);

    return {
      success: true,
      message: "Đặt lại mật khẩu thành công. Toàn bộ phiên đăng nhập cũ đã được đăng xuất.",
    };
  }

  /**
   * Resend OTP with cooldown
   */
  async resendOtp(identifier, purpose, ip = null) {
    if (!identifier || !purpose) {
      throw new AppError("Thiếu identifier hoặc purpose.", 400);
    }

    const cleanInput = identifier.trim();
    const isPhone = isValidVietnamesePhone(cleanInput);
    const normIdentifier = isPhone
      ? normalizeVietnamesePhone(cleanInput)
      : normalizeEmail(cleanInput);

    // Check cooldown & rate limit
    const { otp, cooldown, ttl } = await otpService.createAndStoreOtp(
      normIdentifier,
      purpose,
      ip
    );

    if (isPhone) {
      await smsService.sendOtpWithFallback({
        phone: normIdentifier,
        otp,
        purpose,
      });
    } else {
      await addEmailJob(normIdentifier, otp);
    }

    return {
      identifier: isPhone ? maskPhone(normIdentifier) : normIdentifier,
      cooldown,
      ttl,
      message: "Mã OTP mới đã được gửi thành công.",
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Profile: Add / Change Phone with OTP Verification
  // ──────────────────────────────────────────────────────────────────────────

  async sendUpdatePhoneOtp(userId, newPhone, ip = null) {
    if (!newPhone || !isValidVietnamesePhone(newPhone)) {
      throw new AppError("Số điện thoại không đúng định dạng di động Việt Nam.", 422);
    }

    const normPhone = normalizeVietnamesePhone(newPhone);
    const existing = await userRepository.findByPhone(normPhone);
    if (existing && String(existing._id) !== String(userId)) {
      const err = new AppError("Số điện thoại này đã được sử dụng bởi tài khoản khác.", 409);
      err.code = "PHONE_EXISTS";
      throw err;
    }

    const { otp, cooldown } = await otpService.createAndStoreOtp(
      normPhone,
      "verify_phone",
      ip
    );

    await smsService.sendOtpWithFallback({
      phone: normPhone,
      otp,
      purpose: "verify_phone",
    });

    return {
      phone: maskPhone(normPhone),
      cooldown,
      message: "Mã OTP xác thực số điện thoại đã được gửi.",
    };
  }

  async verifyAndUpdatePhone(userId, newPhone, otp) {
    if (!newPhone || !otp) {
      throw new AppError("Thiếu số điện thoại hoặc mã OTP.", 400);
    }

    const normPhone = normalizeVietnamesePhone(newPhone);
    await otpService.verifyOtp(normPhone, "verify_phone", otp);

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("Không tìm thấy người dùng.", 404);
    }

    user.phone = normPhone;
    await user.save();

    return {
      id: user._id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sign Out & Refresh Token (Preserved)
  // ──────────────────────────────────────────────────────────────────────────

  async signOut(refreshToken, jti = null) {
    if (refreshToken) {
      const hashedRt = hashToken(refreshToken);
      const sessionKey = await redis.get(`rt:${hashedRt}`);
      if (sessionKey) {
        await redis.del(sessionKey);
        await redis.del(`rt:${hashedRt}`);
      }
    }
    if (jti) {
      await redis.del(`at:${jti}`);
    }
  }

  async refreshAccessToken(refreshToken, ip = null, ua = null) {
    if (!refreshToken) {
      throw new AppError("Thiếu refresh token", 401);
    }

    const hashedRt = hashToken(refreshToken);
    const sessionKey = await redis.get(`rt:${hashedRt}`);
    if (!sessionKey) {
      throw new AppError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn", 401);
    }

    const sessionDataStr = await redis.get(sessionKey);
    if (!sessionDataStr) {
      throw new AppError("Phiên đăng nhập không tồn tại", 401);
    }

    const sessionData = JSON.parse(sessionDataStr);
    const parts = sessionKey.split(":");
    const userId = parts[1];
    const oldJti = parts[2];

    const user = await userRepository.findById(userId);
    if (!user || user.status === "blocked") {
      await redis.del(sessionKey);
      await redis.del(`rt:${hashedRt}`);
      throw new AppError("Tài khoản không tồn tại hoặc đã bị khóa", 403);
    }

    await redis.del(`at:${oldJti}`);

    const newJti = crypto.randomUUID();
    const newAccessToken = jwt.sign(
      { userId: user._id, jti: newJti },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const newRefreshToken = crypto.randomBytes(60).toString("hex");
    const newHashedRt = hashToken(newRefreshToken);

    const newSessionKey = `sess:${user._id}:${newJti}`;
    const newSessionData = {
      refreshToken: newHashedRt,
      ip,
      ua,
      createdAt: sessionData.createdAt,
    };

    const pipeline = redis.pipeline();
    pipeline.del(sessionKey);
    pipeline.del(`rt:${hashedRt}`);
    pipeline.set(newSessionKey, JSON.stringify(newSessionData), "EX", REFRESH_TOKEN_REDIS_TTL);
    pipeline.set(`rt:${newHashedRt}`, newSessionKey, "EX", REFRESH_TOKEN_REDIS_TTL);
    pipeline.set(`at:${newJti}`, String(user._id), "EX", ACCESS_TOKEN_REDIS_TTL);
    await pipeline.exec();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user,
    };
  }

  async signOutAll(userId) {
    if (!userId) return;

    let cursor = "0";
    const pattern = `sess:${userId}:*`;
    const sessionKeys = [];

    do {
      const reply = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = reply[0];
      sessionKeys.push(...reply[1]);
    } while (cursor !== "0");

    if (sessionKeys.length === 0) return;

    const sessionDataList = await redis.mget(...sessionKeys);
    const pipeline = redis.pipeline();

    sessionKeys.forEach((sessionKey, index) => {
      pipeline.del(sessionKey);

      const parts = sessionKey.split(":");
      if (parts.length === 3) {
        const jti = parts[2];
        pipeline.del(`at:${jti}`);
      }

      const dataStr = sessionDataList[index];
      if (dataStr) {
        try {
          const sessionData = JSON.parse(dataStr);
          if (sessionData.refreshToken) {
            pipeline.del(`rt:${sessionData.refreshToken}`);
          }
        } catch {
          // Ignore parse errors
        }
      }
    });

    await pipeline.exec();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Legacy Email OTP compatibility methods
  // ──────────────────────────────────────────────────────────────────────────

  async sendOTP(email) {
    if (!email) throw new AppError("Email required", 400);
    const normalizedEmail = normalizeEmail(email);
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) throw new AppError("Email đã tồn tại!", 409);

    const otp = generateOTP();
    await authRepository.deleteOtpsByEmail(normalizedEmail);
    await authRepository.createOtp({
      email: normalizedEmail,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await addEmailJob(normalizedEmail, otp);
    return otp;
  }

  async sendResetPasswordOTP(email) {
    if (!email) throw new AppError("Email required", 400);
    const normalizedEmail = normalizeEmail(email);
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (!existingUser) throw new AppError("Email không tồn tại", 404);

    const otp = generateOTP();
    await authRepository.deleteOtpsByEmail(normalizedEmail);
    await authRepository.createOtp({
      email: normalizedEmail,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await addEmailJob(normalizedEmail, otp);
    return otp;
  }

  async verifyOTP(email, otp) {
    if (!email || !otp) throw new AppError("Thiếu email hoặc OTP", 400);
    const normalizedEmail = normalizeEmail(email);
    const data = await authRepository.findOtpByEmail(normalizedEmail);

    if (!data) throw new AppError("OTP không tồn tại", 400);
    if (data.expiresAt < new Date()) {
      await authRepository.deleteOtpByEmail(normalizedEmail);
      throw new AppError("OTP đã hết hạn", 400);
    }
    if (String(data.otp) !== String(otp)) throw new AppError("OTP sai", 400);

    return true;
  }

  async resetPassword(email, otp, newPassword) {
    if (!email || !otp || !newPassword) throw new AppError("Thiếu dữ liệu", 400);
    await this.verifyOTP(email, otp);

    const normalizedEmail = normalizeEmail(email);
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) throw new AppError("Không tìm thấy user", 404);

    user.passWord = await bcrypt.hash(newPassword, 10);
    await user.save();
    await authRepository.deleteOtpsByEmail(normalizedEmail);
    await this.signOutAll(user._id);
  }

  async signInWithGoogle(idToken, ip = null, ua = null) {
    if (!idToken) throw new AppError("Thiếu idToken Google", 400);

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: [
          process.env.GOOGLE_CLIENT_ID,
          process.env.VITE_GOOGLE_CLIENT_ID,
        ].filter(Boolean),
      });
      payload = ticket.getPayload();
    } catch (error) {
      logger.error("Xác thực Google ID Token thất bại:", error);
      throw new AppError("Xác thực ID Token Google không hợp lệ hoặc đã hết hạn", 401);
    }

    const email = payload.email;
    if (!email) throw new AppError("Không lấy được email từ Google account", 400);

    const fullName = payload.name || `${payload.family_name || ""} ${payload.given_name || ""}`.trim() || "Google User";
    const avatarUrl = payload.picture;
    const normalizedEmail = normalizeEmail(email);
    let user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPass = await bcrypt.hash(randomPassword, 10);
      user = await userRepository.create({
        passWord: hashedPass,
        fullName,
        email: normalizedEmail,
        avatar_url: avatarUrl,
      });
    } else if (user.status === "blocked") {
      throw new AppError("Tài khoản của bạn đã bị khóa.", 403);
    }

    return await this.issueAuthSession(user, ip, ua);
  }
}

export default new AuthService();
