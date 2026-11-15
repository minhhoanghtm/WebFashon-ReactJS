import mongoose from "mongoose";
import "../users/user.model.js";
import "../categories/category.model.js";
import "../banners/banner.model.js";
import "../websiteSettings/page.model.js";
import "../products/product.model.js";

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
      required: true,
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0, "Giá trị giảm không được âm"],
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: [0, "Mức giảm tối đa không được âm"],
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
      maxlength: [200, "Tên chiến dịch tối đa 200 ký tự"],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
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
    bannerUrl: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["flash_sale", "seasonal", "mega_sale", "clearance"],
      required: [true, "Loại chiến dịch là bắt buộc"],
      default: "flash_sale",
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "active", "paused", "ended"],
      required: true,
      default: "draft",
      index: true,
    },
    startAt: {
      type: Date,
      required: [true, "Thời gian bắt đầu là bắt buộc"],
      index: true,
    },
    endAt: {
      type: Date,
      required: [true, "Thời gian kết thúc là bắt buộc"],
      index: true,
    },
    priority: {
      type: Number,
      default: 0,
      index: true,
    },
    // Áp dụng cho danh mục nào (rỗng = toàn sàn nếu không chỉ định sản phẩm)
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    // Áp dụng cho sản phẩm cụ thể
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    // Sản phẩm loại trừ
    excludedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    // Quy tắc giảm giá chung cho chiến dịch (áp dụng nếu không cấu hình flash sale theo item)
    discountRule: {
      type: discountRuleSchema,
      default: null,
    },
    // Giới hạn số lượng mua trong chiến dịch mỗi người
    usageLimitPerCustomer: {
      type: Number,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

campaignSchema.pre("validate", function (next) {
  if (this.startAt && this.endAt) {
    if (new Date(this.endAt) <= new Date(this.startAt)) {
      const err = new Error("Thời gian kết thúc (endAt) phải lớn hơn thời gian bắt đầu (startAt)");
      if (typeof next === "function") return next(err);
      throw err;
    }
  }

  if (this.type === "seasonal") {
    if (!this.discountRule || !this.discountRule.discountValue || this.discountRule.discountValue <= 0) {
      const err = new Error("Chiến dịch mùa (seasonal) bắt buộc phải có quy tắc giảm giá (discountRule) hợp lệ");
      if (typeof next === "function") return next(err);
      throw err;
    }
  }

  if (typeof next === "function") {
    next();
  }
});

// Compound indexes
campaignSchema.index({ status: 1, startAt: 1, endAt: 1 });
campaignSchema.index({ isDeleted: 1, priority: -1 });

const Campaign = mongoose.model("Campaign", campaignSchema);
export default Campaign;
