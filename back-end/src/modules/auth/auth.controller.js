import authService from "./auth.service.js";
import { successResponse } from "../../common/responses/index.js";

const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

export const signUp = async (req, res, next) => {
  try {
    const user = await authService.signUp(req.body);
    return successResponse(res, user, "Đăng ký thành công!", 201);
  } catch (error) {
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const { email, passWord } = req.body;
    const { accessToken, refreshToken, user } = await authService.signIn(email, passWord);

    // Set refresh token in httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    return successResponse(res, { accessToken }, `User ${user.fullName} đã login!, UserId: ${user.id}`);
  } catch (error) {
    next(error);
  }
};

export const signOut = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    await authService.signOut(token);

    res.clearCookie("refreshToken");
    return res.status(204).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const sendOTPController = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.sendOTP(email);
    return successResponse(res, null, "OTP sent");
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    await authService.verifyOTP(email, otp);
    return successResponse(res, null, "Xác thực OTP thành công");
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    await authService.resetPassword(email, otp, newPassword);
    return successResponse(res, null, "Reset mật khẩu thành công");
  } catch (error) {
    next(error);
  }
};
