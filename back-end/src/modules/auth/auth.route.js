import express from "express";
import {
  resetPassword,
  sendOTPController,
  signIn,
  signOut,
  signUp,
  verifyOTP,
} from "./auth.controller.js";
import {
  validateSignUp,
  validateSignIn,
  validateSendOTP,
  validateVerifyOTP,
  validateResetPassword,
} from "./auth.validator.js";

const router = express.Router();

router.post("/signUp", validateSignUp, signUp);
router.post("/signIn", validateSignIn, signIn);
router.post("/signOut", signOut);
router.post("/sendOTP", validateSendOTP, sendOTPController);
router.post("/verify-otp", validateVerifyOTP, verifyOTP);
router.post("/resetPassword", validateResetPassword, resetPassword);

export default router;
