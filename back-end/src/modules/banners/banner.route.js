import express from "express";
import {
  getActiveBanners,
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  toggleBannerStatus,
  deleteBanner,
  trackClick,
} from "./banner.controller.js";
import { protectedRoute, adminOnly } from "../../middlewares/auth.middleware.js";
import { validateCreateBanner, validateUpdateBanner } from "./banner.validator.js";

const bannerRouter = express.Router();

// Public endpoints
bannerRouter.get("/active", getActiveBanners);
bannerRouter.post("/:id/click", trackClick);

// Administrative endpoints (protected by auth and admin role)
bannerRouter.get("/", protectedRoute, adminOnly, getAllBanners);
bannerRouter.get("/:id", protectedRoute, adminOnly, getBannerById);
bannerRouter.post("/", protectedRoute, adminOnly, validateCreateBanner, createBanner);
bannerRouter.put("/:id", protectedRoute, adminOnly, validateUpdateBanner, updateBanner);
bannerRouter.delete("/:id", protectedRoute, adminOnly, deleteBanner);
bannerRouter.patch("/:id/toggle-status", protectedRoute, adminOnly, toggleBannerStatus);

export default bannerRouter;
