import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true // mỗi user 1 cart
  },

  total_items: {
    type: Number,
    default: 0
  },

  total_price: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;