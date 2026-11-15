import mongoose from "mongoose";
import { Order, OrderItem } from "./order.model.js";
import orderFacade from "./order.facade.js";
import { successResponse } from "../../common/responses/index.js";
import { AppError } from "../../common/exceptions/AppError.js";
import WebsiteSettings from "../websiteSettings/websiteSettings.model.js";
import crypto from "crypto";

const getGuestAccessToken = (req) =>
  req.get("x-guest-order-token") || req.body?.guest_access_token || null;

const assertOrderOwner = (order, userId, action) => {
  if (!userId || !order?.user_id || String(order.user_id) !== String(userId)) {
    throw new AppError(`Bạn không có quyền ${action} đơn hàng này`, 403);
  }
};

const getAuthorizedGuestOrder = async (req, action) => {
  const accessToken = getGuestAccessToken(req);
  if (!accessToken) {
    throw new AppError("Cần mã truy cập đơn hàng khách", 401);
  }

  const order = await Order.findById(req.params.id)
    .select("+guest_access_token_hash");
  if (!order) throw new AppError("Đơn hàng không tồn tại", 404);
  if (order.user_id || !order.is_guest || !order.guest_access_token_hash) {
    throw new AppError(`Bạn không có quyền ${action} đơn hàng này`, 403);
  }

  const expected = Buffer.from(order.guest_access_token_hash, "hex");
  const actual = Buffer.from(
    crypto.createHash("sha256").update(accessToken).digest("hex"),
    "hex",
  );
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw new AppError(`Bạn không có quyền ${action} đơn hàng này`, 403);
  }
  return order;
};

export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user?.userId || null;
    const order = await orderFacade.createOrder(userId, req.body);
    return res.status(200).json({
      success: true,
      message: "Đặt hàng thành công",
      order,
      ...(order.guestAccessToken ? { guest_access_token: order.guestAccessToken } : {}),
    });
  } catch (error) {
    next(error);
  }
};

export const getOrdersByUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const orders = await orderFacade.getOrdersByUser(userId);
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
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const existing = await Order.findById(id);
    if (!existing) {
      return next(new AppError("Đơn hàng không tồn tại", 404));
    }
    assertOrderOwner(existing, userId, "chỉnh sửa");
    await orderFacade.updateOrder(id, req.body);
    return successResponse(res, null, "Cập nhật đơn hàng thành công");
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const existing = await Order.findById(id);
    if (!existing) {
      return next(new AppError("Đơn hàng không tồn tại", 404));
    }
    assertOrderOwner(existing, userId, "xóa");
    await orderFacade.deleteOrder(id);
    return successResponse(res, null, "Xóa đơn hàng thành công");
  } catch (error) {
    next(error);
  }
};

export const paymentOrder = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError("Bạn cần đăng nhập để thanh toán đơn hàng", 401);
    const { orderId, payment_method } = req.body;
    const result = await orderFacade.paymentOrder(
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

export const updateGuestOrder = async (req, res, next) => {
  try {
    await getAuthorizedGuestOrder(req, "chỉnh sửa");
    await orderFacade.updateOrder(req.params.id, req.body);
    return successResponse(res, null, "Cập nhật đơn hàng thành công");
  } catch (error) {
    next(error);
  }
};

export const deleteGuestOrder = async (req, res, next) => {
  try {
    await getAuthorizedGuestOrder(req, "xóa");
    await orderFacade.deleteOrder(req.params.id);
    return successResponse(res, null, "Xóa đơn hàng thành công");
  } catch (error) {
    next(error);
  }
};

export const payGuestOrder = async (req, res, next) => {
  try {
    await getAuthorizedGuestOrder(req, "thanh toán");
    const result = await orderFacade.paymentOrder(
      null,
      req.params.id,
      req.body.payment_method,
      { guestAuthorized: true },
    );
    return res.status(200).json({
      success: true,
      message: result.message,
      ...(result.paymentUrl ? { paymentUrl: result.paymentUrl } : { order: result.order }),
    });
  } catch (error) {
    next(error);
  }
};

export const paymentCallback = async (req, res, next) => {
  try {
    const { orderId } = req.query;
    // BẢO MẬT: Chặn bypass trạng thái thanh toán từ query parameters không xác thực
    const order = orderId ? await orderFacade.getOrderDetail(orderId).catch(() => null) : null;
    const paymentStatus = order?.payment_status || "pending";
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/payment/${orderId || ""}`);
  } catch (error) {
    next(error);
  }
};

// Read-only payment view. A browser return URL never changes the order state;
// only verified provider IPNs/admin workflows may do that.
export const getOrderPayment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) throw new AppError("Đơn hàng không tồn tại", 404);
    if (!req.user?.userId || String(order.user_id || "") !== String(req.user.userId)) throw new AppError("Bạn không có quyền xem thanh toán đơn này", 403);
    const settings = await WebsiteSettings.findOne({ singletonKey: "default" }).lean();
    const payment = settings?.payment || {};
    const method = order.payment_method;
    const expiresAt = order.payment_expires_at || (method === "bank_transfer" ? new Date(new Date(order.createdAt).getTime() + 86400000) : new Date(new Date(order.createdAt).getTime() + Number(process.env.ONLINE_PAYMENT_TTL_MINUTES || 15) * 60000));
    const bank = method === "bank_transfer" ? {
      bankName: payment.bankName || "",
      bin: payment.bankBin || "",
      accountNumber: payment.accountNumber || "",
      accountName: payment.accountName || "",
      transferContent: `${payment.transferPrefix || "ORDER"}${String(order._id).slice(-8).toUpperCase()}`,
    } : undefined;
    return successResponse(res, { orderId: String(order._id), orderCode: String(order._id).slice(-8).toUpperCase(), method, amount: order.total_price, currency: "VND", expiresAt, paymentStatus: order.payment_status, bank }, "Lấy thông tin thanh toán thành công");
  } catch (error) { next(error); }
};

export const kpi = async (req, res, next) => {
  try {
    const data = await orderFacade.getKPIs();
    return successResponse(res, data, "Lấy dữ liệu thống kê thành công");
  } catch (error) {
    next(error);
  }
};

export const getRevenueOverview = async (req, res, next) => {
  try {
    const { type } = req.query;
    const data = await orderFacade.getRevenueOverview(type);
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getOrderStats = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const stats = await orderFacade.getOrderStats(userId);
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
    const stats = await orderFacade.getPurchasePerformance();
    return successResponse(res, stats);
  } catch (error) {
    next(error);
  }
};

export const createOrderItem = async (req, res, next) => {
  try {
    await orderFacade.createOrderItem(req.body);
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
    const orderItems = await orderFacade.getOrderItemsByOrderId(order_id);
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
    await orderFacade.updateOrderItem(id, req.body);
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
    await orderFacade.deleteOrderItem(id);
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
    const result = await orderFacade.getAdminOrders({
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
    const order = await orderFacade.updateOrderStatus(id, status);
    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};


export const guestOrderLookup = async (req, res, next) => {
  try {
    const orderId = req.query.orderId || req.body?.orderId || req.query.orderCode || req.body?.orderCode;
    const phone = req.query.phone || req.body?.phone;

    if (!orderId || !phone) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp mã đơn hàng và số điện thoại đặt hàng.",
      });
    }

    const cleanPhone = phone.toString().trim().replace(/[\s\-\.]/g, "").replace(/^\+84/, "0");
    const cleanOrderId = orderId.toString().trim();

    let query = {};
    if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
      query._id = new mongoose.Types.ObjectId(cleanOrderId);
    } else {
      // Find orders whose ID ends with cleanOrderId or exact match string
      query = {
        $or: [
          { transaction_id: cleanOrderId },
          { _id: cleanOrderId }
        ]
      };
    }

    let order = null;
    try {
      order = await Order.findOne(query).lean();
    } catch (e) {
      // If ObjectId cast fails
    }

    if (!order && cleanOrderId.length >= 6) {
      // Find all recent orders to match suffix
      const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(100).lean();
      order = recentOrders.find(
        (o) => o._id.toString().toUpperCase().endsWith(cleanOrderId.toUpperCase())
      );
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng phù hợp với thông tin đã nhập.",
      });
    }

    const orderPhone = (order.shipping_address?.phone || "")
      .toString()
      .trim()
      .replace(/[\s\-\.]/g, "")
      .replace(/^\+84/, "0");

    if (orderPhone !== cleanPhone) {
      return res.status(404).json({
        success: false,
        message: "Số điện thoại không khớp với thông tin đơn hàng.",
      });
    }

    const items = await OrderItem.find({ order_id: order._id }).lean();

    return res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        order_code: order._id.toString().slice(-8).toUpperCase(),
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        total_price: order.total_price,
        original_price: order.original_price,
        discount_amount: order.discount_amount,
        shipping_address: order.shipping_address,
        is_guest: order.is_guest || false,
        guest_email: order.guest_email || null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items,
      },
    });
  } catch (error) {
    next(error);
  }
};
