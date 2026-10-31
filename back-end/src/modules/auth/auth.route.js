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
