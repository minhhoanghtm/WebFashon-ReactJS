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
} from "./auth.controller.js";
import { protectedRoute, optionalProtectedRoute } from "../../middlewares/auth.middleware.js";
import {
  validateSignUp,
  validateSignIn,
  validateSendOTP,
  validateVerifyOTP,
  validateResetPassword,
} from "./auth.validator.js";
import {
  signInLimiter,
  signUpLimiter,
  sendOtpLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
} from "../../middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.post("/signUp", signUpLimiter, validateSignUp, signUp);
router.post("/signIn", signInLimiter, validateSignIn, signIn);
router.post("/signOut", optionalProtectedRoute, signOut);
router.post("/signOutAll", protectedRoute, signOutAllDevices);
router.post("/refreshToken", refreshAccessToken);
router.post("/sendOTP", sendOtpLimiter, validateSendOTP, sendOTPController);
router.post("/sendResetOTP", sendOtpLimiter, validateSendOTP, sendResetOTPController);
router.post("/verify-otp", verifyOtpLimiter, validateVerifyOTP, verifyOTP);
router.post("/resetPassword", resetPasswordLimiter, validateResetPassword, resetPassword);

export default router;
