import mongoose from "mongoose";
import orderRepository from "../order.repository.js";
import { restoreOrderStock } from "./cancelOrder.command.js";
import { AppError } from "../../../common/exceptions/AppError.js";

export const updateOrder = async (id, orderBody) => {
  const order = await orderRepository.findById(id);
  if (!order) {
    throw new AppError("Đơn hàng không tồn tại", 404);
  }

  const oldStatus = order.status;
  const oldPaymentStatus = order.payment_status;

  // BẢO MẬT: Chống Mass Assignment - Whitelist các trường thông tin được phép cập nhật
  const safeCustomerFields = ["shipping_address", "phone_number", "note", "recipient_name"];
  for (const field of safeCustomerFields) {
    if (orderBody[field] !== undefined) {
      order[field] = orderBody[field];
    }
  }

  // Cập nhật trạng thái nếu hợp lệ
  if (orderBody.status && ["cancelled", "shipping", "delivered", "confirmed"].includes(orderBody.status)) {
    order.status = orderBody.status;
  }

  if (
    (order.status === "cancelled" && oldStatus !== "cancelled") ||
    (order.payment_status === "failed" && oldPaymentStatus !== "failed")
  ) {
    await restoreOrderStock(order);
  }

  if (order.status === "delivered" && order.payment_method === "cod") {
    order.payment_status = "paid";
    if (!order.paid_at) {
      order.paid_at = new Date();
    }
  }

  if (order.status === "delivered" && oldStatus !== "delivered") {
    import("../../tracking/tracking.service.js")
      .then(({ default: trackingService }) => {
        trackingService.trackPurchaseCompleted(order);
      })
      .catch((err) =>
        console.warn("[Tracking] Lỗi ghi nhận purchase_completed khi cập nhật giao hàng:", err.message)
      );
  }

  await order.save();

  // Trigger status change notification
  import("../../../sockets/events.js")
    .then(({ emitOrderNotification }) => {
      emitOrderNotification(order);
    })
    .catch((err) =>
      console.error("Failed to emit order socket notification:", err.message),
    );

  return order;
};

export const updateOrderStatus = async (id, status) => {
  const order = await orderRepository.findById(id);
  if(!order) {
    throw new AppError("Đơn hàng không tồn tại", 404);
  }
  
  const oldStatus = order.status;
  order.status = status === "shipped" ? "shipping" : status;
  
  if (order.status === "cancelled" && oldStatus !== "cancelled") {
    await restoreOrderStock(order);
  }
  
  if (order.status === "delivered" && oldStatus !== "delivered") {
    if (order.payment_method === "cod") {
      order.payment_status = "paid";
      order.paid_at = new Date();
    }
    // Ghi nhận sự kiện purchase_completed khi đơn hàng đã giao thành công
    import("../../tracking/tracking.service.js")
      .then(({ default: trackingService }) => {
        trackingService.trackPurchaseCompleted(order);
      })
      .catch((err) => console.warn("[Tracking] Lỗi ghi nhận purchase_completed khi giao hàng:", err.message));
  }
  
  await order.save();
  return order;
};

export const paymentCallback = async (orderId, status, transactionId) => {
  const order = await orderRepository.findById(orderId);
  if (!order) {
    throw new AppError("Đơn hàng không tồn tại", 404);
  }

  if (status === "success") {
    order.payment_status = "paid";
    order.transaction_id = transactionId;
    order.paid_at = new Date();
    order.status = "confirmed";

    // Ghi nhận sự kiện purchase_completed khi thanh toán online được xác minh thành công
    import("../../tracking/tracking.service.js")
      .then(({ default: trackingService }) => {
        trackingService.trackPurchaseCompleted(order);
      })
      .catch((err) => console.warn("[Tracking] Lỗi ghi nhận purchase_completed qua payment callback:", err.message));
  } else {
    order.payment_status = "failed";
  }
  await order.save();

  // Trigger payment callback status notification
  import("../../../sockets/events.js")
    .then(({ emitOrderNotification }) => {
      emitOrderNotification(order);
    })
    .catch((err) =>
      console.error("Failed to emit order socket notification:", err.message),
    );

  return order;
};

// OrderItem methods
export const createOrderItem = async (itemData) => {
  if (itemData && itemData.product_id) {
    if (!mongoose.Types.ObjectId.isValid(itemData.product_id)) {
      throw new AppError("product_id không hợp lệ", 400);
    }
    itemData.product_id = new mongoose.Types.ObjectId(itemData.product_id);
  }
  return await orderRepository.createItem(itemData);
};

export const updateOrderItem = async (id, itemData) => {
  const updated = await orderRepository.findItemByIdAndUpdate(id, itemData, {
    new: true,
  });
  if (!updated) {
    throw new AppError("Không tìm thấy sản phẩm trong đơn hàng", 404);
  }
  return updated;
};

export const deleteOrderItem = async (id) => {
  const deleted = await orderRepository.findItemByIdAndDelete(id);
  if (!deleted) {
    throw new AppError("Không tìm thấy sản phẩm trong đơn hàng", 404);
  }
  return deleted;
};
