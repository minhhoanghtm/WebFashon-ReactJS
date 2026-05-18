import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    content: {
        text: {
            type: String,
            required: true,
            maxlength: 1000
        },
        images: {
            type: [String],
            validate: [arr => arr.length <= 5, "Không được upload quá 5 hình ảnh"]
        },
        videos: {
            type: [String],
            validate: [arr => arr.length <= 2, "Không được upload quá 2 video"]
        }
    },
    likes_count: {
      type: Number,
      default: 0
    }
}, {
    timestamps: true
});

ReviewSchema.index({
    product_id: 1,
    user_id: 1
}, {
    unique: true
});
const Review = mongoose.model("Review", ReviewSchema);
export default Review;