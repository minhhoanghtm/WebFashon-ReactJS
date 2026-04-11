import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },

  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant"
  },
  quantity: {
    type: Number,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  //snapshot
  product_name: String,
  product_image: String

}, { timestamps: true });

const OrderItem = mongoose.model("OrderItem", orderItemSchema);
export default OrderItem;