import express from "express";
import {
  resetPassword,
  sendOTPController,
  sendResetOTPController,
  signIn,
  signOut,
  signUp,
  verifyOTP,
  refreshAccessToken,
  signOutAllDevices,
  signInWithGoogle,
  sendRegisterOtpController,
  verifyRegisterController,
  sendLoginOtpController,
  verifyLoginOtpController,
  sendForgotPasswordOtpController,
  resetPasswordWithOtpController,
  resendOtpController,
} from "./auth.controller.js";
import { protectedRoute, optionalProtectedRoute } from "../../middlewares/auth.middleware.js";
import {
  validateSignUp,
  validateSignIn,
  validateSendOTP,
  validateVerifyOTP,
  validateResetPassword,
  validateSendRegisterOtp,
  validateVerifyRegister,
  validateSendLoginOtp,
  validateVerifyLoginOtp,
  validateForgotPassword,
  validateResetPasswordWithOtp,
  validateResendOtp,
} from "./auth.validator.js";
import {
  signInLimiter,
  signUpLimiter,
  sendOtpLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
} from "../../middlewares/rateLimiter.middleware.js";
import { ConsoleSmsProvider } from "../sms/providers/console.provider.js";

const router = express.Router();

// ── SMS & Modern Auth Routes ────────────────────────────────────────────────
router.post("/register/send-otp", sendOtpLimiter, validateSendRegisterOtp, sendRegisterOtpController);
router.post("/register/verify", signUpLimiter, validateVerifyRegister, verifyRegisterController);

router.post("/login", signInLimiter, validateSignIn, signIn);
router.post("/login/otp/send", sendOtpLimiter, validateSendLoginOtp, sendLoginOtpController);
router.post("/login/otp/verify", signInLimiter, validateVerifyLoginOtp, verifyLoginOtpController);

router.post("/password/forgot", sendOtpLimiter, validateForgotPassword, sendForgotPasswordOtpController);
router.post("/password/reset", resetPasswordLimiter, validateResetPasswordWithOtp, resetPasswordWithOtpController);
router.post("/otp/resend", sendOtpLimiter, validateResendOtp, resendOtpController);

// Dev/Test helper endpoint to inspect simulated OTP in development
if (process.env.NODE_ENV !== "production") {
  router.get("/dev/latest-otp", (req, res) => {
    const { phone } = req.query;
    const otp = ConsoleSmsProvider.getLastOtp(phone);
    return res.json({ success: true, otp: otp || null });
  });

  router.post("/dev/reset-rate-limits", async (req, res) => {
    try {
      const redis = (await import("../../configs/redis.js")).default();
      const keys = await redis.keys("otp*");
      const lockKeys = await redis.keys("login:*");
      const allKeys = [...keys, ...lockKeys];
      if (allKeys.length > 0) {
        await redis.del(...allKeys);
      }
      return res.json({ success: true, cleared: allKeys.length });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
}

// ── Legacy Auth Routes (Backwards Compatibility) ────────────────────────────
router.post("/signUp", signUpLimiter, validateSignUp, signUp);
router.post("/signIn", signInLimiter, validateSignIn, signIn);
router.post("/signOut", optionalProtectedRoute, signOut);
router.post("/signOutAll", protectedRoute, signOutAllDevices);
router.post("/refreshToken", refreshAccessToken);
router.post("/sendOTP", sendOtpLimiter, validateSendOTP, sendOTPController);
router.post("/sendResetOTP", sendOtpLimiter, validateSendOTP, sendResetOTPController);
router.post("/verify-otp", verifyOtpLimiter, validateVerifyOTP, verifyOTP);
router.post("/resetPassword", resetPasswordLimiter, validateResetPassword, resetPassword);
router.post("/google", signInWithGoogle);

export default router;
