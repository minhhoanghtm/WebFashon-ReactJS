import CartItem from "../models/CartItem.js";

export const addCartItem = async (req, res) => {
    try {
        await CartItem.create(req.body);
        res.status(200).json({
            message: "Thêm vào giỏ hàng thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi addCartItem:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const getCartItems = async (req, res) => {
    try {
        const { cart_id } = req.params;
        const cartItems = await CartItem.find({ cart_id }).populate("product_id").populate("variant_id");
        res.status(200).json(cartItems);
    } catch (error) {
        console.error("Lỗi khi gọi getCartItems:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const updateCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        await CartItem.findByIdAndUpdate(id, req.body);
        res.status(200).json({
            message: "Cập nhật sản phẩm trong giỏ hàng thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi updateCartItem:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const deleteCartItem = async (req, res) => { 
    try {
        const { id } = req.params;  
        await CartItem.findByIdAndDelete(id);
        res.status(200).json({
            message: "Xóa sản phẩm khỏi giỏ hàng thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi deleteCartItem:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}
