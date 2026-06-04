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

const router = express.Router();

// Chạy sau middleware protectedRoute nên mặc định đã được bảo vệ
router.get("/me", authMe);
router.put("/updatePassword", updatePassword);
router.put("/updateProfile", updateProfile);

// Chỉ Admin mới được truy cập
router.get("/admin/users", adminOnly, getAllUsers);
router.post("/admin/users", adminOnly, createUser);
router.put("/admin/users/:id", adminOnly, updateUser);
router.delete("/admin/users/:id", adminOnly, deleteUser);

export default router;
