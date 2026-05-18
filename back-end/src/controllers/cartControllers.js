import Cart from "../models/Cart.js";

export const addCart = async (req, res) => {
    try {
        await Cart.create(req.body);
        res.status(200).json({ success: true,
            message: "Thêm vào giỏ hàng thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi addCart:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi hệ thống"
        });
    }
}

export const getCart = async (req, res) => {
    try {
        const userId = req.user.userId; // Lấy userId từ req (giả sử đã được xác thực)  
        console.log("getCart userId:", userId);
        const cartItems = await Cart.find({ user_id: userId });
        res.status(200).json({ success: true, data: cartItems });
    } catch (error) {
        console.error("Lỗi khi gọi getCart:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi hệ thống"
        });
    }
}

export const updateCart = async (req, res) => {
    try {
        const { id } = req.params;
        await Cart.findByIdAndUpdate(id, req.body);
        res.status(200).json({
            success: true,
            message: "Cập nhật giỏ hàng thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi updateCart:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi hệ thống"
        });
    }
}

export const deleteCart = async (req, res) => {
    try {
        const { id } = req.params;  
        await Cart.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Xóa khỏi giỏ hàng thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi deleteCart:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi hệ thống"
        });
    }
}
