import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  displayProduct: {
    type: Array
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },

  description: {
    type: String
  },

  old_price: {
    type: Number,
    required: true
  },
  new_price: {
    type: Number,
    required: true
  },
  sold: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  is_active: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

const Product = mongoose.model("Product", productSchema);

export default Product;