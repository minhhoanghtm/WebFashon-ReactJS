import { requireFeature } from "../../middlewares/featureGuard.middleware.js";
import express from "express";
import {
  getPublicVouchers,
  claimVoucher,
  getUserWallet,
  validateVoucher,
  getAdminVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  toggleVoucherStatus,
  getDashboardStats,
} from "./voucher.controller.js";
import { protectedRoute, adminOnly, noAdmin } from "../../middlewares/auth.middleware.js";
import { claimRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const voucherRouter = express.Router();

// Public / Client Voucher APIs
voucherRouter.get("/", requireFeature("enableVoucher", "Tính năng mã giảm giá hiện đang tạm tắt"), getPublicVouchers);
voucherRouter.post("/claim", requireFeature("enableVoucher", "Tính năng mã giảm giá hiện đang tạm tắt"), protectedRoute, noAdmin, claimRateLimiter, claimVoucher);
voucherRouter.get("/wallet", requireFeature("enableVoucher", "Tính năng mã giảm giá hiện đang tạm tắt"), protectedRoute, getUserWallet);
voucherRouter.post("/validate", requireFeature("enableVoucher", "Tính năng mã giảm giá hiện đang tạm tắt"), protectedRoute, validateVoucher);

// Admin Voucher APIs (wrapped in protectedRoute + adminOnly)
voucherRouter.get("/admin/stats", protectedRoute, adminOnly, getDashboardStats);
voucherRouter.get("/admin", protectedRoute, adminOnly, getAdminVouchers);
voucherRouter.post("/admin", protectedRoute, adminOnly, createVoucher);
voucherRouter.put("/admin/:id", protectedRoute, adminOnly, updateVoucher);
voucherRouter.delete("/admin/:id", protectedRoute, adminOnly, deleteVoucher);
voucherRouter.patch("/admin/:id/status", protectedRoute, adminOnly, toggleVoucherStatus);

export default voucherRouter;

