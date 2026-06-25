import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.Mixed,
      ref: "Product",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    content: {
      text: {
        type: String,
        required: true,
        maxlength: 1000,
      },
      images: {
        type: [String],
        validate: [(arr) => arr.length <= 5, "Không được upload quá 5 hình ảnh"],
      },
      videos: {
        type: [String],
        validate: [(arr) => arr.length <= 2, "Không được upload quá 2 video"],
      },
    },
    likes_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index(
  {
    product_id: 1,
    user_id: 1,
  },
  {
    unique: true,
  }
);

// Static method to update product rating
ReviewSchema.statics.updateProductRating = async function (productId) {
  if (!productId) return;

  const stats = await this.aggregate([
    {
      $match: {
        $or: [
          { product_id: mongoose.Types.ObjectId.isValid(productId) ? new mongoose.Types.ObjectId(productId) : productId },
          { product_id: productId.toString() }
        ]
      }
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" }
      }
    }
  ]);

  let averageRating = 0;
  if (stats.length > 0) {
    averageRating = Number(stats[0].avgRating.toFixed(1));
  }

  const Product = mongoose.model("Product");
  await Product.findByIdAndUpdate(productId, { rating: averageRating });

  // Clear product list cache so UI shows new rating
  try {
    const { getRedisConnection } = await import("../../configs/redis.js");
    const redis = getRedisConnection();
    const keys = await redis.keys("products:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (cacheErr) {
    // Ignore cache errors
  }
};

// Post hooks to automatically update product rating
ReviewSchema.post("save", async function (doc) {
  if (doc && doc.product_id) {
    await doc.constructor.updateProductRating(doc.product_id);
  }
});

ReviewSchema.post("findOneAndUpdate", async function (doc) {
  if (doc && doc.product_id) {
    await doc.constructor.updateProductRating(doc.product_id);
  }
});

ReviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc && doc.product_id) {
    await doc.constructor.updateProductRating(doc.product_id);
  }
});

const Review = mongoose.model("Review", ReviewSchema);
export default Review;

