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
import { adminOnly } from "../../middlewares/auth.middleware.js";
import { claimRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const voucherRouter = express.Router();

// Public / Client Voucher APIs (already wrapped in protectedRoute at rootRouter)
voucherRouter.get("/", getPublicVouchers);
voucherRouter.post("/claim", claimRateLimiter, claimVoucher);
voucherRouter.get("/wallet", getUserWallet);
voucherRouter.post("/validate", validateVoucher);

// Admin Voucher APIs (wrapped in protectedRoute + adminOnly)
voucherRouter.get("/admin/stats", adminOnly, getDashboardStats);
voucherRouter.get("/admin", adminOnly, getAdminVouchers);
voucherRouter.post("/admin", adminOnly, createVoucher);
voucherRouter.put("/admin/:id", adminOnly, updateVoucher);
voucherRouter.delete("/admin/:id", adminOnly, deleteVoucher);
voucherRouter.patch("/admin/:id/status", adminOnly, toggleVoucherStatus);

export default voucherRouter;

