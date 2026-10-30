import mongoose from "mongoose";

const discountRuleSchema = new mongoose.Schema(
  {
    scope: {
      type: String,
      enum: ["all", "categories", "products"],
      default: "all",
    },
    categoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0.01, "Giá trị giảm giá phải lớn hơn 0"],
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  { _id: false }
);

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên chiến dịch là bắt buộc"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug chiến dịch là bắt buộc"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["flash_sale", "seasonal"],
      required: [true, "Loại chiến dịch là bắt buộc"],
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "active", "ended"],
      default: "draft",
      index: true,
    },
    startAt: {
      type: Date,
      required: [true, "Thời gian bắt đầu là bắt buộc"],
    },
    endAt: {
      type: Date,
      required: [true, "Thời gian kết thúc là bắt buộc"],
    },
    priority: {
      type: Number,
      default: 0,
    },
    bannerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Banner",
      default: null,
    },
    pageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Page",
      default: null,
    },
    discountRule: {
      type: discountRuleSchema,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

campaignSchema.pre("validate", function (next) {
  if (this.startAt && this.endAt) {
    if (new Date(this.endAt) <= new Date(this.startAt)) {
      return next(new Error("Thời gian kết thúc (endAt) phải lớn hơn thời gian bắt đầu (startAt)"));
    }
  }

  if (this.type === "seasonal") {
    if (!this.discountRule || !this.discountRule.discountValue || this.discountRule.discountValue <= 0) {
      return next(new Error("Chiến dịch mùa (seasonal) bắt buộc phải có quy tắc giảm giá (discountRule) hợp lệ"));
    }
  }

  next();
});

// Compound indexes
campaignSchema.index({ status: 1, startAt: 1, endAt: 1 });
campaignSchema.index({ isDeleted: 1, priority: -1 });

const Campaign = mongoose.model("Campaign", campaignSchema);
export default Campaign;

