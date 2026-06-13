import mongoose from "mongoose";

const voucherHistorySchema = new mongoose.Schema(
  {
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE", "CLAIM", "USE", "STATUS_CHANGE", "EXPIRED"],
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Null means system actions (e.g. cron job expire)
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

voucherHistorySchema.index({ voucherId: 1, createdAt: -1 });

const VoucherHistory = mongoose.model("VoucherHistory", voucherHistorySchema);

export default VoucherHistory;
