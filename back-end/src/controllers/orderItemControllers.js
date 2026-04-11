import OrderItem from "../models/OrderItem.js";

export const createOrderItem = async (req, res) => {
    try {
        await OrderItem.create(req.body);
        res.status(200).json({
            message: "Thêm sản phẩm vào đơn hàng thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi createOrderItem:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const getOrderItemsByOrder = async (req, res) => {
    try {
        const { order_id } = req.params;
        const orderItems = await OrderItem.find({ order_id }).populate("product_id").populate("variant_id");
        res.status(200).json(orderItems);
    } catch (error) {
        console.error("Lỗi khi gọi getOrderItemsByOrder:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const updateOrderItem = async (req, res) => {
    try {
        const { id } = req.params;
        await OrderItem.findByIdAndUpdate(id, req.body);
        res.status(200).json({
            message: "Cập nhật sản phẩm trong đơn hàng thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi updateOrderItem:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const deleteOrderItem = async (req, res) => {
    try {
        const { id } = req.params;  
        await OrderItem.findByIdAndDelete(id);
        res.status(200).json({
            message: "Xóa sản phẩm khỏi đơn hàng thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi deleteOrderItem:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

