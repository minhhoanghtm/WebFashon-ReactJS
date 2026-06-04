import reviewService from "./review.service.js";
import { successResponse } from "../../common/responses/index.js";

export const getReviewsByProductIdController = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await reviewService.getReviewsByProductId(productId);
    return successResponse(res, reviews);
  } catch (error) {
    next(error);
  }
};

export const createReviewController = async (req, res, next) => {
  try {
    const user_id = req.user?.userId;
    const review = await reviewService.createReview(user_id, req.body);
    return successResponse(res, review, "Thêm đánh giá thành công", 201);
  } catch (error) {
    next(error);
  }
};

export const updateReviewController = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const review = await reviewService.updateReview(reviewId, req.body);
    return successResponse(res, review, "Cập nhật đánh giá thành công");
  } catch (error) {
    next(error);
  }
};

export const deleteReviewController = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    await reviewService.deleteReview(reviewId);
    return successResponse(res, null, "Xóa đánh giá thành công");
  } catch (error) {
    next(error);
  }
};
