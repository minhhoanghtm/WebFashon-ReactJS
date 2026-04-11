import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  total_price: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
    default: "pending"
  },

  payment_method: {
    type: String,
    enum: ["cod", "momo", "vnpay"],
    default: "cod"
  },

  shipping_address: {
    type: String,
    required: true
  }

}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
export default Order;