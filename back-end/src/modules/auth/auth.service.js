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
dotenv.config();

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

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

  async signIn(email, passWord) {
    if (!email || !passWord) {
      throw new AppError("Thiếu email hoặc password", 400);
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new AppError("Email hoặc password không đúng", 401);
    }

    if (user.status === "blocked") {
      throw new AppError("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", 403);
    }

    const passWordCorrect = await bcrypt.compare(passWord, user.passWord);
    if (!passWordCorrect) {
      throw new AppError("Email hoặc password không đúng", 401);
    }

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const refreshToken = crypto.randomBytes(60).toString("hex");
    await authRepository.createSession({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

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

  async signOut(refreshToken) {
    if (refreshToken) {
      await authRepository.deleteSessionByRefreshToken(refreshToken);
    }
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
    if (!email || !otp || !newPassword) {
      throw new AppError("Thiếu dữ liệu", 400);
    }

    await this.verifyOTP(email, otp);

    const normalizedEmail = normalizeEmail(email);
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new AppError("Không tìm thấy user", 404);
    }

    user.passWord = await bcrypt.hash(newPassword, 10);
    await user.save();

    await authRepository.deleteOtpsByEmail(normalizedEmail);
  }
}

export default new AuthService();
