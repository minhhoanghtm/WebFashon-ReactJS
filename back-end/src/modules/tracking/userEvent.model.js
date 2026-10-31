import mongoose from "mongoose";
import { ALL_EVENT_TYPES } from "./tracking.constants.js";

const userEventSchema = new mongoose.Schema(
  {
    event_id: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
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
    session_id: {
      type: String,
      default: null,
      trim: true,
    },
    event_type: {
      type: String,
      required: true,
      enum: ALL_EVENT_TYPES,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    query: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },
    source: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    context: {
      deviceType: { type: String, default: null, trim: true },
      referrer: { type: String, default: null, trim: true },
      pathname: { type: String, default: null, trim: true },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Bắt buộc có ít nhất user_id hoặc anonymous_id
userEventSchema.pre("validate", function () {
  if (!this.user_id && !this.anonymous_id) {
    throw new Error("Phải có ít nhất user_id hoặc anonymous_id");
  }
});

// Compound indexes phục vụ truy vấn analytics & profile nhanh chóng
userEventSchema.index({ user_id: 1, createdAt: -1 });
userEventSchema.index({ anonymous_id: 1, createdAt: -1 });
userEventSchema.index({ session_id: 1, createdAt: -1 });
userEventSchema.index({ product_id: 1, event_type: 1 });
userEventSchema.index({ event_type: 1, createdAt: -1 });
userEventSchema.index({ "meta.experiment_id": 1, event_type: 1, createdAt: -1 });
userEventSchema.index({ "meta.experiment_id": 1, "meta.variant": 1, event_type: 1 });

// Idempotency Index: Đảm bảo một đơn hàng và sản phẩm không bao giờ bị ghi nhận duplicate purchase_completed
userEventSchema.index(
  { "meta.order_id": 1, product_id: 1, event_type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      event_type: "purchase_completed",
      "meta.order_id": { $exists: true, $type: "string" },
    },
  }
);

// TTL Index: Mặc định 90 ngày (đọc từ biến môi trường USER_EVENTS_TTL_DAYS)
const ttlDays = parseInt(process.env.USER_EVENTS_TTL_DAYS || "90", 10);
const ttlSeconds = ttlDays * 24 * 60 * 60;
userEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: ttlSeconds });

const UserEvent = mongoose.model("user_events", userEventSchema);

export default UserEvent;
