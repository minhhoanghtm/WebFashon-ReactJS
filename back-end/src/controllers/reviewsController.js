import Review from "../models/Review.js";
import mongoose from "mongoose";


export const getReviewsByProductIdController = async (req, res) => {
  const { productId } = req.params;
    try {
        const reviews = await Review.find({ product_id: productId }).populate("user_id", "fullName avatar_url");
        return res.status(200).json({
            success: true,            
            data: reviews,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const createReviewController = async (req, res) => {
    const { product_id, rating, content } = req.body;
    // authMiddlewares sets `req.user` to the decoded token payload
    // which contains `userId` (not `_id`). Use that as `user_id`.
    const user_id = req.user?.userId;
    
    try {
        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: "Bạn cần đăng nhập để gửi đánh giá"
            });
        }

        // Validate required fields
        if (!product_id || !rating || !content?.text) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin bắt buộc (product_id, rating, text)"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(product_id)) {
            return res.status(400).json({
                success: false,
                message: "product_id không hợp lệ"
            });
        }

        const reviewPayload = {
            rating,
            content: {
                text: content.text,
                images: content.images || [],
                videos: content.videos || []
            }
        };

        const savedReview = await Review.findOneAndUpdate(
            { product_id, user_id },
            {
                $set: reviewPayload,
                $setOnInsert: { product_id, user_id }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        return res.status(201).json({
            success: true,
            data: savedReview,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateReviewController = async (req, res) => {
    const { reviewId } = req.params;
    const { rating, content } = req.body;
    try {
        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            { 
                rating,
                content: {
                    text: content?.text,
                    images: content?.images || [],
                    videos: content?.videos || []
                }
            },
            { new: true }
        );
        if (!updatedReview) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }
        return res.status(200).json({
            success: true,
            data: updatedReview,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteReviewController = async (req, res) => {
    const { reviewId } = req.params;
    try {
        const deletedReview = await Review.findByIdAndDelete(reviewId);
        if (!deletedReview) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Review deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};