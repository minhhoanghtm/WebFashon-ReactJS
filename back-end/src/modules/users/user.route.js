import express from "express";
import {
  authMe,
  createUser,
  deleteUser,
  getAllUsers,
  updatePassword,
  updateProfile,
  updateUser,
  sendUpdatePhoneOtpController,
  verifyAndUpdatePhoneController,
} from "./user.controller.js";
import { protectedRoute, adminOnly } from "../../middlewares/auth.middleware.js";
import { sendOtpLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  validateCreateUser,
  validateUpdateUser,
  validateUpdatePassword,
  validateUpdateProfile,
  validateUserIdParam,
  validateSendPhoneOtp,
  validateVerifyPhoneOtp,
} from "./user.validator.js";

const router = express.Router();

// Chạy sau middleware protectedRoute nên mặc định đã được bảo vệ
router.get("/me", authMe);
router.put("/updatePassword", validateUpdatePassword, updatePassword);
router.put("/updateProfile", validateUpdateProfile, updateProfile);
router.put("/phone/send-otp", sendOtpLimiter, validateSendPhoneOtp, sendUpdatePhoneOtpController);
router.put("/phone/verify", validateVerifyPhoneOtp, verifyAndUpdatePhoneController);

// Chỉ Admin mới được truy cập
router.get("/admin/users", protectedRoute, adminOnly, getAllUsers);
router.post("/admin/users", protectedRoute, adminOnly, validateCreateUser, createUser);
router.put("/admin/users/:id", protectedRoute, adminOnly, validateUpdateUser, updateUser);
router.delete("/admin/users/:id", protectedRoute, adminOnly, validateUserIdParam, deleteUser);

export default router;
