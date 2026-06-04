import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    size: {
      type: String,
    },
    stock: {
      type: Number,
      min: 0,
      default: 0,
    },
    image_url: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

productVariantSchema.index(
  {
    product_id: 1,
    color: 1,
    size: 1,
  },
  {
    unique: true,
  }
);

const ProductVariant = mongoose.model("product_variants", productVariantSchema);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    name_no_accents: {
      type: String,
      index: true,
    },
    displayProduct: {
      type: Array,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    old_price: {
      type: Number,
      required: true,
    },
    new_price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual("variants", {
  ref: "product_variants",
  localField: "_id",
  foreignField: "product_id",
});

const Product = mongoose.model("Product", productSchema);

export { Product, ProductVariant };
export default Product;
