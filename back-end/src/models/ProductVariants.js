import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    color: {
        type: String,
        required: true
    },
    size: {
        type: String,
    },
    stock: {
        type: Number,
        min: 0,
        default: 0
    },

    image_url: {
        type: String,
        required: true
    }

}, {
    timestamps: true
});

//unique theo product + color
productVariantSchema.index({
    product_id: 1,
    color: 1,
    size: 1
}, {
    unique: true
});
const ProductVariant = mongoose.model("product_variants", productVariantSchema);
export default ProductVariant;