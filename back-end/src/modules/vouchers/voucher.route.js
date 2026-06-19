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
import { protectedRoute, adminOnly } from "../../middlewares/auth.middleware.js";
import { claimRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const voucherRouter = express.Router();

// Public / Client Voucher APIs
voucherRouter.get("/", getPublicVouchers);
voucherRouter.post("/claim", protectedRoute, claimRateLimiter, claimVoucher);
voucherRouter.get("/wallet", protectedRoute, getUserWallet);
voucherRouter.post("/validate", protectedRoute, validateVoucher);

// Admin Voucher APIs (wrapped in protectedRoute + adminOnly)
voucherRouter.get("/admin/stats", protectedRoute, adminOnly, getDashboardStats);
voucherRouter.get("/admin", protectedRoute, adminOnly, getAdminVouchers);
voucherRouter.post("/admin", protectedRoute, adminOnly, createVoucher);
voucherRouter.put("/admin/:id", protectedRoute, adminOnly, updateVoucher);
voucherRouter.delete("/admin/:id", protectedRoute, adminOnly, deleteVoucher);
voucherRouter.patch("/admin/:id/status", protectedRoute, adminOnly, toggleVoucherStatus);

export default voucherRouter;

