import express from "express";
import {
  authMe,
  createUser,
  deleteUser,
  getAllUsers,
  updatePassword,
  updateProfile,
  updateUser,
} from "./user.controller.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";
import {
  validateCreateUser,
  validateUpdateUser,
  validateUpdatePassword,
  validateUpdateProfile,
  validateUserIdParam,
} from "./user.validator.js";

const router = express.Router();

// Chạy sau middleware protectedRoute nên mặc định đã được bảo vệ
router.get("/me", authMe);
router.put("/updatePassword", validateUpdatePassword, updatePassword);
router.put("/updateProfile", validateUpdateProfile, updateProfile);

// Chỉ Admin mới được truy cập
router.get("/admin/users", adminOnly, getAllUsers);
router.post("/admin/users", adminOnly, validateCreateUser, createUser);
router.put("/admin/users/:id", adminOnly, validateUpdateUser, updateUser);
router.delete("/admin/users/:id", adminOnly, validateUserIdParam, deleteUser);

export default router;
