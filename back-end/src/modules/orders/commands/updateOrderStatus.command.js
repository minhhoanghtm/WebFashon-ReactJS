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

  Object.assign(order, orderBody);

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
  
  if (order.status === "delivered" && order.payment_method === "cod") {
    order.payment_status = "paid";
    order.paid_at = new Date();
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
