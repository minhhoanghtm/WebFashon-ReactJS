import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
    try {
        const order = await Order.create(req.body); 
        res.status(200).json({
            message: "Đặt hàng thành công",
            order
        });
    } catch (error) {
        console.error("Lỗi khi gọi createOrder:", error);
        res.status(500).json({  
            message: "Lỗi hệ thống"
        });
    }       
}

export const getOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ user_id: userId });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Lỗi khi gọi getOrdersByUser:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        await Order.findByIdAndUpdate(id, req.body);
        res.status(200).json({
            message: "Cập nhật đơn hàng thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi updateOrder:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}


export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        await Order.findByIdAndDelete(id);
        res.status(200).json({
            message: "Xóa đơn hàng thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi deleteOrder:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}