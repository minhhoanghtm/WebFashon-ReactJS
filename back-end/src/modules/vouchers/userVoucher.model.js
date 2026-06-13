import mongoose from "mongoose";

const userVoucherSchema = new mongoose.Schema(
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
    claimedAt: {
      type: Date,
      default: Date.now,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["CLAIMED", "USED", "EXPIRED"],
      default: "CLAIMED",
      index: true,
    },
  },
  { timestamps: true }
);

// A user can only claim a specific voucher once
userVoucherSchema.index({ userId: 1, voucherId: 1 }, { unique: true });
// Optimize querying user's vouchers by status
userVoucherSchema.index({ userId: 1, status: 1 });

const UserVoucher = mongoose.model("UserVoucher", userVoucherSchema);

export default UserVoucher;
