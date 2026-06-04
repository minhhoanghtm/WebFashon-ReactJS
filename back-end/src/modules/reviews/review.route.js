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
router.post("/", protectedRoute, createReviewController);
router.put("/:reviewId", protectedRoute, updateReviewController);
router.delete("/:reviewId", protectedRoute, deleteReviewController);

export default router;
