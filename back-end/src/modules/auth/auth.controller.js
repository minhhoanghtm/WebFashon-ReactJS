import authService from "./auth.service.js";
import { successResponse } from "../../common/responses/index.js";
import trackingService from "../tracking/tracking.service.js";

const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

export const signUp = async (req, res, next) => {
  try {
    const user = await authService.signUp(req.body);
    const anonymousId = req.body.anonymous_id || req.headers["x-anonymous-id"];

    if (anonymousId && (user?._id || user?.id)) {
      trackingService
        .mergeAnonymousToUser(anonymousId, user._id || user.id)
        .catch((err) =>
          console.error("Lỗi khi gộp anonymous profile vào user (signUp):", err.message)
        );
    }

    return successResponse(res, user, "Đăng ký thành công!", 201);
  } catch (error) {
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const identifier = req.body.emailOrPhone || req.body.phone || req.body.email;
    const { passWord } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const ua = req.headers["user-agent"];

    const { accessToken, refreshToken, user } = await authService.signIn(identifier, passWord, ip, ua);

    const anonymousId = req.body.anonymous_id || req.headers["x-anonymous-id"];
    if (anonymousId && (user?.id || user?._id)) {
      trackingService
        .mergeAnonymousToUser(anonymousId, user.id || user._id)
        .catch((err) =>
          console.error("Lỗi khi gộp anonymous profile vào user (signIn):", err.message)
        );
    }

    // Set refresh token in httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    return successResponse(
      res,
      { accessToken, userId: user.id || user._id, user },
      `User ${user.fullName} đã đăng nhập thành công!`
    );
  } catch (error) {
    next(error);
  }
};

export const sendRegisterOtpController = async (req, res, next) => {
  try {
    const { phone, channel } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const result = await authService.sendRegisterOtp(phone, channel, ip);
    return successResponse(res, result, result.message || "Mã OTP đăng ký đã được gửi.");
  } catch (error) {
    next(error);
  }
};

export const verifyRegisterController = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const ua = req.headers["user-agent"];
    const { accessToken, refreshToken, user } = await authService.verifyRegisterAndCreateUser(
      req.body,
      ip,
      ua
    );

    const anonymousId = req.body.anonymous_id || req.headers["x-anonymous-id"];
    if (anonymousId && (user?.id || user?._id)) {
      trackingService
        .mergeAnonymousToUser(anonymousId, user.id || user._id)
        .catch((err) =>
          console.error("Lỗi khi gộp anonymous profile vào user (verifyRegister):", err.message)
        );
    }

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    return successResponse(
      res,
      { accessToken, userId: user.id || user._id, user },
      "Đăng ký tài khoản thành công!",
      201
    );
  } catch (error) {
    next(error);
  }
};

export const sendLoginOtpController = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const result = await authService.sendLoginOtp(phone, ip);
    return successResponse(res, result, result.message || "Mã OTP đăng nhập đã được gửi.");
  } catch (error) {
    next(error);
  }
};

export const verifyLoginOtpController = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const ua = req.headers["user-agent"];
    const { accessToken, refreshToken, user } = await authService.verifyLoginOtp(phone, otp, ip, ua);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    return successResponse(
      res,
      { accessToken, userId: user.id || user._id, user },
      `User ${user.fullName} đã đăng nhập bằng OTP thành công!`
    );
  } catch (error) {
    next(error);
  }
};

export const sendForgotPasswordOtpController = async (req, res, next) => {
  try {
    const identifier = req.body.identifier || req.body.phone || req.body.email;
    const { channel } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const result = await authService.sendForgotPasswordOtp(identifier, channel, ip);
    return successResponse(res, result.data, result.message);
  } catch (error) {
    next(error);
  }
};

export const resetPasswordWithOtpController = async (req, res, next) => {
  try {
    const identifier = req.body.identifier || req.body.phone || req.body.email;
    const { otp, newPassword } = req.body;
    const result = await authService.resetPasswordWithOtp(identifier, otp, newPassword);
    res.clearCookie("refreshToken");
    return successResponse(res, null, result.message);
  } catch (error) {
    next(error);
  }
};

export const resendOtpController = async (req, res, next) => {
  try {
    const identifier = req.body.identifier || req.body.phone || req.body.email;
    const { purpose } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const result = await authService.resendOtp(identifier, purpose, ip);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const signOut = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    const jti = req.user?.jti;
    await authService.signOut(token, jti);

    res.clearCookie("refreshToken");
    return res.status(204).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const ua = req.headers["user-agent"];

    const { accessToken, refreshToken, user } = await authService.refreshAccessToken(token, ip, ua);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    return successResponse(res, { accessToken }, `Refresh token thành công cho user ${user.fullName}`);
  } catch (error) {
    next(error);
  }
};

export const signOutAllDevices = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được user",
      });
    }

    await authService.signOutAll(userId);

    res.clearCookie("refreshToken");
    return successResponse(res, null, "Đăng xuất khỏi tất cả các thiết bị thành công");
  } catch (error) {
    next(error);
  }
};

export const sendOTPController = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.sendOTP(email);
    return successResponse(res, null, "Mã OTP đã được gửi đến email của bạn");
  } catch (error) {
    next(error);
  }
};

export const sendResetOTPController = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.sendResetPasswordOTP(email);
    return successResponse(res, null, "Mã OTP đã được gửi đến email của bạn");
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

export const signInWithGoogle = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const ua = req.headers["user-agent"];
    const { accessToken, refreshToken, user } = await authService.signInWithGoogle(idToken, ip, ua);

    const anonymousId = req.body.anonymous_id || req.headers["x-anonymous-id"];
    if (anonymousId && (user?._id || user?.id)) {
      trackingService
        .mergeAnonymousToUser(anonymousId, user._id || user.id)
        .catch((err) =>
          console.error("Lỗi khi gộp anonymous profile vào user (Google):", err.message)
        );
    }

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    return successResponse(
      res,
      { accessToken, userId: user._id || user.id },
      `User ${user.fullName} đã login bằng Google!, UserId: ${user._id || user.id}`
    );
  } catch (error) {
    next(error);
  }
};
