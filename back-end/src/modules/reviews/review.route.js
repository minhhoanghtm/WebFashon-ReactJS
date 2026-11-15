import { requireFeature } from "../../middlewares/featureGuard.middleware.js";
import express from "express";
import {
  createReviewController,
  deleteReviewController,
  getReviewsByProductIdController,
  updateReviewController,
} from "./review.controller.js";
import { protectedRoute } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/:productId", getReviewsByProductIdController);
router.post("/", requireFeature("enableReviews", "Tính năng đánh giá sản phẩm hiện đang tạm tắt"), protectedRoute, createReviewController);
router.put("/:reviewId", requireFeature("enableReviews", "Tính năng đánh giá sản phẩm hiện đang tạm tắt"), protectedRoute, updateReviewController);
router.delete("/:reviewId", requireFeature("enableReviews", "Tính năng đánh giá sản phẩm hiện đang tạm tắt"), protectedRoute, deleteReviewController);

export default router;
