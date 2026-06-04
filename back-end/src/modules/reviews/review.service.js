import reviewRepository from "./review.repository.js";
import { AppError } from "../../common/exceptions/AppError.js";
import mongoose from "mongoose";
import Review from "./review.model.js";

class ReviewService {
  async getReviewsByProductId(productId) {
    // Populate user details: fullName and avatar_url
    return await Review.find({ product_id: productId }).populate(
      "user_id",
      "fullName avatar_url"
    );
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

    return await reviewRepository.findOneAndUpdate(
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
    return updatedReview;
  }

  async deleteReview(reviewId) {
    const deletedReview = await reviewRepository.findByIdAndDelete(reviewId);
    if (!deletedReview) {
      throw new AppError("Review not found", 404);
    }
    return deletedReview;
  }
}

export default new ReviewService();
