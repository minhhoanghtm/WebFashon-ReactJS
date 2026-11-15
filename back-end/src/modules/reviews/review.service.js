import { Order, OrderItem } from "../orders/order.model.js";
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

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new AppError("Số sao đánh giá phải từ 1 đến 5", 400);
    }

    const sanitizedText = String(content.text || "")
      .replace(/<[^>]*>?/gm, "")
      .trim();

    if (!sanitizedText) {
      throw new AppError("Nội dung đánh giá không được để trống", 400);
    }

    // Purchase check: User must have at least one delivered order containing this product
    const deliveredOrders = await Order.find({
      user_id: userId,
      status: "delivered",
    }).select("_id").lean();

    if (!deliveredOrders || deliveredOrders.length === 0) {
      throw new AppError(
        "Chỉ khách hàng đã nhận hàng thành công mới có thể đánh giá sản phẩm này.",
        403,
        "NOT_PURCHASED"
      );
    }

    const deliveredOrderIds = deliveredOrders.map((o) => o._id);
    const hasPurchasedProduct = await OrderItem.exists({
      order_id: { $in: deliveredOrderIds },
      $or: [
        { product_id: new mongoose.Types.ObjectId(product_id) },
        { product_id: product_id.toString() },
      ],
    });

    if (!hasPurchasedProduct) {
      throw new AppError(
        "Bạn chỉ có thể đánh giá sản phẩm mà bạn đã mua và nhận hàng thành công.",
        403,
        "NOT_PURCHASED"
      );
    }

    const productObjectId = new mongoose.Types.ObjectId(product_id);
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const reviewPayload = {
      rating,
      content: {
        text: sanitizedText,
        images: content.images || [],
        videos: content.videos || [],
      },
    };

    const review = await reviewRepository.findOneAndUpdate(
      { product_id: productObjectId, user_id: userObjectId },
      {
        $set: reviewPayload,
        $setOnInsert: { product_id: productObjectId, user_id: userObjectId },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    await this.updateProductRating(productObjectId);
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
