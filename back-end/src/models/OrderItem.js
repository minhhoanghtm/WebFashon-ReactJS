import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true
  },

  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true
  },
  variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
    index: true
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
  product_image: String,
  product_slug: String

}, { timestamps: true });

orderItemSchema.index({ order_id: 1 });
orderItemSchema.index({ order_id: 1, product_id: 1 });

const OrderItem = mongoose.model("order_items", orderItemSchema);
export default OrderItem;