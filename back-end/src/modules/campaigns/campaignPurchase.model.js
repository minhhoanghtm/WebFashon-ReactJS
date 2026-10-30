import mongoose from "mongoose";

const campaignPurchaseSchema = new mongoose.Schema(
  {
    campaign_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Số lượng đã mua phải lớn hơn 0"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique compound index: Chống ghi nhận trùng cho cùng một sản phẩm trong đơn hàng
campaignPurchaseSchema.index({ order_id: 1, product_id: 1 }, { unique: true });

// Index đếm giới hạn per_user_limit nhanh chóng
campaignPurchaseSchema.index({ campaign_id: 1, user_id: 1 });

const CampaignPurchase = mongoose.model("CampaignPurchase", campaignPurchaseSchema);
export default CampaignPurchase;

