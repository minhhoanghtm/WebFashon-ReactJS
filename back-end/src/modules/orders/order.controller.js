import orderService from "./order.service.js";
import { successResponse } from "../../common/responses/index.js";

export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const order = await orderService.createOrder(userId, req.body);
    return res.status(200).json({
      success: true,
      message: "Đặt hàng thành công",
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrdersByUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const orders = await orderService.getOrdersByUser(userId);
    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    await orderService.updateOrder(id, req.body);
    return successResponse(res, null, "Cập nhật đơn hàng thành công");
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    await orderService.deleteOrder(id);
    return successResponse(res, null, "Xóa đơn hàng thành công");
  } catch (error) {
    next(error);
  }
};

export const paymentOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId, payment_method } = req.body;
    const result = await orderService.paymentOrder(
      userId,
      orderId,
      payment_method,
    );

    if (result.paymentUrl) {
      return res.status(200).json({
        success: true,
        message: result.message,
        paymentUrl: result.paymentUrl,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      order: result.order,
    });
  } catch (error) {
    next(error);
  }
};

export const paymentCallback = async (req, res, next) => {
  try {
    const { orderId, status, transactionId } = req.query;
    const order = await orderService.paymentCallback(
      orderId,
      status,
      transactionId,
    );

    return res.redirect(
      `${process.env.CLIENT_URL}/orders?paymentStatus=${order.payment_status}`,
    );
  } catch (error) {
    next(error);
  }
};

export const kpi = async (req, res, next) => {
  try {
    const data = await orderService.getKPIs();
    return successResponse(res, data, "Lấy dữ liệu thống kê thành công");
  } catch (error) {
    next(error);
  }
};

export const getRevenueOverview = async (req, res, next) => {
  try {
    const { type } = req.query;
    const data = await orderService.getRevenueOverview(type);
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getOrderStats = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const stats = await orderService.getOrderStats(userId);
    return successResponse(res, stats, "Lấy dữ liệu thống kê thành công");
  } catch (error) {
    next(error);
  }
};

export const dashboardUser = async (req, res, next) => {
  try {
    return successResponse(res, [], "Lấy dữ liệu thống kê thành công");
  } catch (error) {
    next(error);
  }
};

export const getPurchasePerformance = async (req, res, next) => {
  try {
    const stats = await orderService.getPurchasePerformance();
    return successResponse(res, stats);
  } catch (error) {
    next(error);
  }
};

export const createOrderItem = async (req, res, next) => {
  try {
    await orderService.createOrderItem(req.body);
    return res.status(200).json({
      success: true,
      message: "Thêm sản phẩm vào đơn hàng thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderItemsByOrderId = async (req, res, next) => {
  try {
    const { order_id } = req.params;
    const orderItems = await orderService.getOrderItemsByOrderId(order_id);
    return res.status(200).json({
      success: true,
      data: orderItems,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await orderService.updateOrderItem(id, req.body);
    return res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm trong đơn hàng thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOrderItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await orderService.deleteOrderItem(id);
    return res.status(200).json({
      success: true,
      message: "Xóa sản phẩm khỏi đơn hàng thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const result = await orderService.getAdminOrders({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      search,
    });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(id, status);
    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
