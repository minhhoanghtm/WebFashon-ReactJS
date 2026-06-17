import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // mỗi user 1 cart
    },
    total_items: {
      type: Number,
      default: 0,
    },
    total_price: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);

const cartItemSchema = new mongoose.Schema(
  {
    cart_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    product_id: {
      type: mongoose.Schema.Types.Mixed,
      ref: "Product",
      required: true,
    },
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product_variants",
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

cartItemSchema.index(
  {
    cart_id: 1,
    product_id: 1,
    variant_id: 1,
  },
  {
    unique: true,
  }
);

const CartItem = mongoose.model("cart_items", cartItemSchema);

export { Cart, CartItem };
export default Cart;
