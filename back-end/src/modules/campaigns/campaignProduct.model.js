import mongoose from "mongoose";

const campaignProductSchema = new mongoose.Schema(
  {
    campaign_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: [true, "campaign_id là bắt buộc"],
      index: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "product_id là bắt buộc"],
      index: true,
    },
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product_variants",
      default: null,
    },
    sale_price: {
      type: Number,
      required: [true, "Giá ưu đãi (sale_price) là bắt buộc"],
      min: [0.01, "Giá ưu đãi phải lớn hơn 0"],
    },
    quota: {
      type: Number,
      required: [true, "Tổng suất khuyến mãi (quota) là bắt buộc"],
      min: [1, "Tổng suất phải tối thiểu là 1"],
    },
    sold: {
      type: Number,
      default: 0,
      min: [0, "Số lượng đã bán không được âm"],
    },
    per_user_limit: {
      type: Number,
      default: null,
      min: [1, "Giới hạn mua mỗi người phải tối thiểu là 1"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

campaignProductSchema.pre("validate", function (next) {
  if (this.sold !== undefined && this.quota !== undefined && this.sold > this.quota) {
    return next(new Error("Số lượng đã bán (sold) không thể vượt quá tổng suất khuyến mãi (quota)"));
  }
  next();
});

// Unique compound index: mỗi campaign chỉ có 1 cấu hình cho cùng một product + variant (variant_id có thể là null)
campaignProductSchema.index(
  { campaign_id: 1, product_id: 1, variant_id: 1 },
  { unique: true }
);

// Index phục vụ truy vấn nhanh theo product
campaignProductSchema.index({ product_id: 1, campaign_id: 1 });

const CampaignProduct = mongoose.model("CampaignProduct", campaignProductSchema);
export default CampaignProduct;

