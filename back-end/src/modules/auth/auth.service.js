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
import { OAuth2Client } from "google-auth-library";
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
  async signUp(userData) {
    const { passWord, lastName, firstName, email, birthday, sex } = userData;

    if (!passWord || !lastName || !firstName || !email) {
      throw new AppError("Không thể thiếu passWord, lastName, firstName, email!", 400);
    }

    const normalizedEmail = normalizeEmail(email);
    const emailExists = await userRepository.findByEmail(normalizedEmail);
    if (emailExists) {
      throw new AppError("Email đã tồn tại!", 409);
    }

    const hashedPass = await bcrypt.hash(passWord, 10);
    const newUser = await userRepository.create({
      passWord: hashedPass,
      fullName: `${lastName} ${firstName}`,
      email: normalizedEmail,
      ...(birthday && { birthday: new Date(birthday) }),
      ...(sex && { sex }),
    });

    return {
      id: newUser._id,
      email: newUser.email,
      fullName: newUser.fullName,
    };
  }

  async signIn(email, passWord, ip = null, ua = null) {
    if (!email || !passWord) {
      throw new AppError("Thiếu email hoặc password", 400);
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new AppError("Email hoặc password không đúng", 401);
    }

    // Temporary lock check (Redis)
    const lockKey = `login:lock:${user._id}`;
    const isLocked = await redis.exists(lockKey);
    if (isLocked) {
      const ttl = await redis.ttl(lockKey);
      throw new AppError(`Tài khoản đã bị khóa tạm thời. Vui lòng thử lại sau ${ttl} giây.`, 403);
    }
    // Verify password
    const passWordCorrect = await bcrypt.compare(passWord, user.passWord);
    if (!passWordCorrect) {
      const failKey = `login:fail:${user._id}`;
      // Increment fail counter (atomic) and keep it for 30 minutes
      const attempts = await redis.incr(failKey);
      await redis.expire(failKey, 30 * 60);
      // Determine lock duration based on progressive thresholds
      let lockTtl = 0;
      if (attempts >= 10) lockTtl = 60 * 60; // 1 hour
      else if (attempts >= 5) lockTtl = 60; // 1 minute
      else if (attempts >= 3) lockTtl = 30; // 30 seconds
      if (lockTtl > 0) {
        await redis.set(lockKey, '1', 'EX', lockTtl);
        await redis.del(failKey);
        logger.warn(`User ${user._id} locked for ${lockTtl}s after ${attempts} failed attempts`);
        throw new AppError(`Quá giới hạn đăng nhập sai. Tài khoản bị khóa tạm thời ${lockTtl} giây.`, 403);
      }
      logger.warn(`Failed login attempt ${attempts} for user ${user._id}`);
      throw new AppError("Email hoặc password không đúng", 401);
    }
    // Successful login – reset counters
    await redis.del(`login:fail:${user._id}`);
    await redis.del(lockKey);

    const jti = crypto.randomUUID();
    const accessToken = jwt.sign(
      { userId: user._id, jti },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const refreshToken = crypto.randomBytes(60).toString("hex");
    const hashedRt = hashToken(refreshToken);

    const sessionKey = `sess:${user._id}:${jti}`;
    const sessionData = {
      refreshToken: hashedRt,
      ip,
      ua,
      createdAt: new Date().toISOString(),
    };

    // Store in Redis
    await redis.set(sessionKey, JSON.stringify(sessionData), "EX", REFRESH_TOKEN_REDIS_TTL);
    await redis.set(`rt:${hashedRt}`, sessionKey, "EX", REFRESH_TOKEN_REDIS_TTL);
    await redis.set(`at:${jti}`, String(user._id), "EX", ACCESS_TOKEN_REDIS_TTL);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async signOut(refreshToken, jti = null) {
    if (refreshToken) {
      const hashedRt = hashToken(refreshToken);
      const sessionKey = await redis.get(`rt:${hashedRt}`);
      if (sessionKey) {
        await redis.del(`rt:${hashedRt}`);
        await redis.del(sessionKey);
        const parts = sessionKey.split(":");
        if (parts.length === 3) {
          const resolvedJti = parts[2];
          await redis.del(`at:${resolvedJti}`);
        }
      }
    }
    if (jti) {
      await redis.del(`at:${jti}`);
    }
  }

  async refreshAccessToken(refreshToken, ip = null, ua = null) {
    if (!refreshToken) {
      throw new AppError("Không tìm thấy refresh token", 401);
    }

    const hashedRt = hashToken(refreshToken);
    const sessionKey = await redis.get(`rt:${hashedRt}`);
    if (!sessionKey) {
      throw new AppError("Refresh token không hợp lệ hoặc đã hết hạn", 403);
    }

    const sessionDataStr = await redis.get(sessionKey);
    if (!sessionDataStr) {
      await redis.del(`rt:${hashedRt}`);
      throw new AppError("Refresh token không hợp lệ hoặc đã hết hạn", 403);
    }

    const sessionData = JSON.parse(sessionDataStr);
    if (sessionData.refreshToken !== hashedRt) {
      throw new AppError("Refresh token không khớp", 403);
    }

    const parts = sessionKey.split(":");
    if (parts.length !== 3) {
      throw new AppError("Session key format error", 500);
    }
    const userId = parts[1];
    const oldJti = parts[2];

    const user = await userRepository.findById(userId);
    if (!user || user.status === "blocked") {
      await this.signOutAll(userId);
      throw new AppError("Người dùng không hợp lệ hoặc tài khoản đã bị khóa", 403);
    }

    // Revoke old access token
    await redis.del(`at:${oldJti}`);
    // Delete old session and lookup key
    await redis.del(sessionKey);
    await redis.del(`rt:${hashedRt}`);

    // Generate new session & tokens (RTR)
    const newJti = crypto.randomUUID();
    const newAccessToken = jwt.sign(
      { userId: user._id, jti: newJti },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const newRefreshToken = crypto.randomBytes(60).toString("hex");
    const newHashedRt = hashToken(newRefreshToken);

    const newSessionKey = `sess:${userId}:${newJti}`;
    const newSessionData = {
      refreshToken: newHashedRt,
      ip: ip || sessionData.ip,
      ua: ua || sessionData.ua,
      createdAt: new Date().toISOString(),
    };

    await redis.set(newSessionKey, JSON.stringify(newSessionData), "EX", REFRESH_TOKEN_REDIS_TTL);
    await redis.set(`rt:${newHashedRt}`, newSessionKey, "EX", REFRESH_TOKEN_REDIS_TTL);
    await redis.set(`at:${newJti}`, String(userId), "EX", ACCESS_TOKEN_REDIS_TTL);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      }
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
        } catch (err) {
          // Ignore parse errors
        }
      }
    });

    await pipeline.exec();
  }

  async sendOTP(email) {
    if (!email) {
      throw new AppError("Email required", 400);
    }

    const normalizedEmail = normalizeEmail(email);

    // Kiểm tra email đã được đăng ký chưa trước khi gửi OTP
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError("Email đã tồn tại!", 409);
    }

    const otp = generateOTP();

    await authRepository.deleteOtpsByEmail(normalizedEmail);
    await authRepository.createOtp({
      email: normalizedEmail,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Delegate email sending to BullMQ queue background processing
    await addEmailJob(normalizedEmail, otp);
    return otp;
  }

  async sendResetPasswordOTP(email) {
    if (!email) {
      throw new AppError("Email required", 400);
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (!existingUser) {
      throw new AppError("Email không tồn tại", 404);
    }

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
    if (!email || !otp) {
      throw new AppError("Thiếu email hoặc OTP", 400);
    }

    const normalizedEmail = normalizeEmail(email);
    const data = await authRepository.findOtpByEmail(normalizedEmail);

    if (!data) {
      throw new AppError("OTP không tồn tại", 400);
    }

    if (data.expiresAt < new Date()) {
      await authRepository.deleteOtpByEmail(normalizedEmail);
      throw new AppError("OTP đã hết hạn", 400);
    }

    if (String(data.otp) !== String(otp)) {
      throw new AppError("OTP sai", 400);
    }

    return true;
  }

  async resetPassword(email, otp, newPassword) {
    console.log("resetPassword inputs:", { email, otp, newPassword: newPassword ? "***" : "missing" });
    if (!email || !otp || !newPassword) {
      throw new AppError("Thiếu dữ liệu", 400);
    }

    await this.verifyOTP(email, otp);

    const normalizedEmail = normalizeEmail(email);
    console.log("resetPassword normalizedEmail:", normalizedEmail);
    const user = await userRepository.findByEmail(normalizedEmail);
    console.log("resetPassword user found:", user ? user._id : "null");
    if (!user) {
      const fs = await import("fs");
      try {
        fs.appendFileSync(
          "src/scratch/error_logs.txt",
          `[${new Date().toISOString()}] ResetPassword fail: email="${email}", normalized="${normalizedEmail}", userNotFound\n`
        );
      } catch (e) {
        console.error("Failed to write log file:", e);
      }
      throw new AppError(`Không tìm thấy user với email: "${normalizedEmail}" (gốc: "${email}")`, 404);
    }

    user.passWord = await bcrypt.hash(newPassword, 10);
    await user.save();

    await authRepository.deleteOtpsByEmail(normalizedEmail);
  }

  async signInWithGoogle(idToken, ip = null, ua = null) {
    if (!idToken) {
      throw new AppError("Thiếu idToken Google", 400);
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: [
          process.env.GOOGLE_CLIENT_ID,
          process.env.VITE_GOOGLE_CLIENT_ID
        ].filter(Boolean),
      });
      payload = ticket.getPayload();
    } catch (error) {
      logger.error("Xác thực Google ID Token thất bại:", error);
      throw new AppError("Xác thực ID Token Google không hợp lệ hoặc đã hết hạn", 401);
    }

    const email = payload.email;
    if (!email) {
      throw new AppError("Không lấy được email từ Google account", 400);
    }

    const fullName = payload.name || `${payload.family_name || ""} ${payload.given_name || ""}`.trim() || "Google User";
    const avatarUrl = payload.picture;

    const normalizedEmail = normalizeEmail(email);
    let user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      // Create user automatically
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

    const jti = crypto.randomUUID();
    const accessToken = jwt.sign(
      { userId: user._id, jti },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const refreshToken = crypto.randomBytes(60).toString("hex");
    const hashedRt = hashToken(refreshToken);

    const sessionKey = `sess:${user._id}:${jti}`;
    const sessionData = {
      refreshToken: hashedRt,
      ip,
      ua,
      createdAt: new Date().toISOString(),
    };

    // Store session in Redis
    await redis.set(sessionKey, JSON.stringify(sessionData), "EX", REFRESH_TOKEN_REDIS_TTL);
    await redis.set(`rt:${hashedRt}`, sessionKey, "EX", REFRESH_TOKEN_REDIS_TTL);
    await redis.set(`at:${jti}`, String(user._id), "EX", ACCESS_TOKEN_REDIS_TTL);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}

export default new AuthService();
