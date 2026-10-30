import reviewRepository from "./review.repository.js";
import { AppError } from "../../common/exceptions/AppError.js";
import mongoose from "mongoose";
import Product from "../products/product.model.js";
import { getRedisConnection } from "../../configs/redis.js";

class ReviewService {
  async getReviewsByProductId(productId) {
    return await reviewRepository.findReviewsWithUserDetails(productId);
  }

  async updateProductRating(productId) {
    try {
      if (!productId) return;

      const list = await reviewRepository.find({
        $or: [
          { product_id: mongoose.Types.ObjectId.isValid(productId) ? new mongoose.Types.ObjectId(productId) : productId },
          { product_id: productId.toString() }
        ]
      });

      let averageRating = 0;
      if (list.length > 0) {
        const total = list.reduce((sum, r) => sum + (r.rating || 0), 0);
        averageRating = Number((total / list.length).toFixed(1));
      }

      await Product.findByIdAndUpdate(productId, { rating: averageRating });

      // Clear product list cache so UI shows new rating
      try {
        const redis = getRedisConnection();
        const keys = await redis.keys("products:*");
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (cacheErr) {
        // Ignore cache errors
      }
    } catch (err) {
      console.error("Failed to update product rating:", err);
    }
  }

  async createReview(userId, reviewData) {
    const { product_id, rating, content } = reviewData;

    if (!userId) {
      throw new AppError("Bạn cần đăng nhập để gửi đánh giá", 401);
    }

    if (!product_id || !rating || !content?.text) {
      throw new AppError("Thiếu thông tin bắt buộc (product_id, rating, text)", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      throw new AppError("product_id không hợp lệ", 400);
    }

    const reviewPayload = {
      rating,
      content: {
        text: content.text,
        images: content.images || [],
        videos: content.videos || [],
      },
    };

    const review = await reviewRepository.findOneAndUpdate(
      { product_id, user_id: userId },
      {
        $set: reviewPayload,
        $setOnInsert: { product_id, user_id: userId },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    await this.updateProductRating(product_id);
    return review;
  }

  async updateReview(reviewId, reviewData) {
    const { rating, content } = reviewData;

    const updatedReview = await reviewRepository.findByIdAndUpdate(
      reviewId,
      {
        rating,
        content: {
          text: content?.text,
          images: content?.images || [],
          videos: content?.videos || [],
        },
      },
      { new: true }
    );

    if (!updatedReview) {
      throw new AppError("Review not found", 404);
    }

    await this.updateProductRating(updatedReview.product_id);
    return updatedReview;
  }

  async deleteReview(reviewId) {
    const deletedReview = await reviewRepository.findByIdAndDelete(reviewId);
    if (!deletedReview) {
      throw new AppError("Review not found", 404);
    }

    await this.updateProductRating(deletedReview.product_id);
    return deletedReview;
  }
}

export default new ReviewService();
