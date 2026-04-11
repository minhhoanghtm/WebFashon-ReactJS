import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    cart_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart",
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
        default: 1,
        min: 1
    },
    price: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// tránh trùng sản phẩm (cùng size + màu)
cartItemSchema.index({
    cart_id: 1,
    product_id: 1,
    size: 1,
    color: 1
}, {
    unique: true
});
const CartItem = mongoose.model("CartItem", cartItemSchema);
export default CartItem;