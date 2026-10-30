import mongoose from "mongoose";

const userInterestProfileSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    anonymous_id: {
      type: String,
      default: null,
      trim: true,
    },
    category_scores: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    keyword_scores: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    preferred_colors: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    preferred_sizes: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    brand_scores: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    price_range: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    recent_product_ids: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Product",
      default: [],
    },
    consent_status: {
      type: String,
      enum: ["granted", "denied"],
      default: "granted",
    },
    total_events_count: {
      type: Number,
      default: 0,
    },
    last_active_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Bắt buộc có user_id hoặc anonymous_id
userInterestProfileSchema.pre("validate", function (next) {
  if (!this.user_id && !this.anonymous_id) {
    return next(new Error("Phải có ít nhất user_id hoặc anonymous_id"));
  }
  next();
});

// Partial unique indexes: đảm bảo duy nhất theo user_id hoặc anonymous_id
userInterestProfileSchema.index(
  { user_id: 1 },
  {
    unique: true,
    partialFilterExpression: { user_id: { $type: "objectId" } },
  }
);

userInterestProfileSchema.index(
  { anonymous_id: 1 },
  {
    unique: true,
    partialFilterExpression: { anonymous_id: { $type: "string" } },
  }
);

const UserInterestProfile = mongoose.model("user_interest_profiles", userInterestProfileSchema);

export default UserInterestProfile;
