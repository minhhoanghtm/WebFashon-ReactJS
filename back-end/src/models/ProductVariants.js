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
        enum: ["S", "M", "L", "XL"]
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
    color: 1
}, {
    unique: true
});

export default mongoose.model("ProductVariants", productVariantSchema);