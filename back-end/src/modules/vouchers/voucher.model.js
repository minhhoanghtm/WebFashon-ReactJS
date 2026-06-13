import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0, "Giá trị giảm giá không được nhỏ hơn 0"],
    },
    maxDiscountAmount: {
      type: Number,
      default: 0, // 0 means no limit for percentage discounts
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: [1, "Tổng số lượng voucher phải lớn hơn 0"],
    },
    claimedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for optimization
voucherSchema.index({ status: 1, isDeleted: 1, startDate: 1, endDate: 1 });
voucherSchema.index({ code: 1, isDeleted: 1 });

const Voucher = mongoose.model("Voucher", voucherSchema);

export default Voucher;

