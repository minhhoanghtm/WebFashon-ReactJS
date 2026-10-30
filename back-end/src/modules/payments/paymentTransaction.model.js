import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["vnpay", "momo"],
      required: true,
      index: true,
    },
    transaction_id: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      required: true,
      index: true,
    },
    raw_response: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique index: { provider: 1, transaction_id: 1 } for non-null strings
paymentTransactionSchema.index(
  { provider: 1, transaction_id: 1 },
  {
    unique: true,
    partialFilterExpression: { transaction_id: { $type: "string" } },
  }
);

const PaymentTransaction = mongoose.model("PaymentTransaction", paymentTransactionSchema);

export default PaymentTransaction;
