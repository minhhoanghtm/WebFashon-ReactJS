import { AppError } from "../../common/exceptions/AppError.js";

const validStatuses = ['pending', 'confirmed', 'shipping', 'shipped', 'delivered', 'cancelled'];
export const validateUpdateOrderStatus = (req, res, next) => {
    const { status } = req.body;
    if(!status) {
        return next(new AppError("Trạng thái mới không được để trống", 400));
    }
    if(!validStatuses.includes(status)) {
        return next(new AppError(`Trạng thái không hợp lệ. Các trạng thái hợp lệ: ${validStatuses.join(", ")}`, 400));
    }
    next();
}