import express from "express";
import {
  createReviewController,
  deleteReviewController,
  getReviewsByProductIdController,
  updateReviewController,
} from "../controllers/reviewsController.js";
import { protectedRoute } from "../middleware/authMiddlewares.js";
const router = express.Router();

router.get("/:productId", getReviewsByProductIdController);
router.post("/", protectedRoute,createReviewController);
router.put("/:reviewId", protectedRoute, updateReviewController);
router.delete("/:reviewId", protectedRoute, deleteReviewController);

export default router;
