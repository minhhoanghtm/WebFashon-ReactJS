import Cart from "../models/Cart.js";

export const addCart = async (req, res) => {
    try {
        await Cart.create(req.body);
        res.status(200).json({
            message: "Thêm vào giỏ hàng thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi addCart:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const getCart = async (req, res) => {
    try {
        const { userId } = req.params;  
        const cartItems = await Cart.find({ userId }).populate("productId");
        res.status(200).json(cartItems);
    } catch (error) {
        console.error("Lỗi khi gọi getCart:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const updateCart = async (req, res) => {
    try {
        const { id } = req.params;
        await Cart.findByIdAndUpdate(id, req.body);
        res.status(200).json({
            message: "Cập nhật giỏ hàng thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi updateCart:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const deleteCart = async (req, res) => {
    try {
        const { id } = req.params;  
        await Cart.findByIdAndDelete(id);
        res.status(200).json({
            message: "Xóa khỏi giỏ hàng thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi deleteCart:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}
