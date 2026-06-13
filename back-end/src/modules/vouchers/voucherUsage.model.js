import mongoose from "mongoose";

const voucherUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
voucherUsageSchema.index({ orderId: 1 }, { unique: true }); // One order can only use one voucher usage record

const VoucherUsage = mongoose.model("VoucherUsage", voucherUsageSchema);


export default VoucherUsage;
