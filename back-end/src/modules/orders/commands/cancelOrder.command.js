import orderRepository from "../order.repository.js";
import productFacade from "../../products/product.facade.js";
import { Order, OrderItem } from "../order.model.js";
import { AppError } from "../../../common/exceptions/AppError.js";

export const restoreOrderStock = async (order, session = null) => {
  // Atomic guard to prevent double restore
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, stock_deducted: true },
    { $set: { stock_deducted: false } },
    { returnDocument: 'after', session }
  );

  if (!updatedOrder) {
    return; // Already restored or never deducted
  }

  const orderItems = await OrderItem.find({ order_id: order._id }).session(session);
  if (orderItems && orderItems.length > 0) {
    await productFacade.restoreStock(orderItems, session);
  }
};

export const cancelExpiredOrder = async (orderId) => {
  const order = await orderRepository.findById(orderId);
  if (!order) {
    throw new AppError("Đơn hàng không tồn tại", 404);
  }

  if (order.status !== "pending") {
    return order; // Already processed
  }

  console.log(`⏰ [Expired Check] Auto cancelling expired order ${orderId}...`);
  order.status = "cancelled";
  order.payment_status = "failed";

  await restoreOrderStock(order);
  await order.save();

  // Trigger socket notification
  import("../../../sockets/events.js")
    .then(({ emitOrderNotification }) => {
      emitOrderNotification(order);
    })
    .catch((err) =>
      console.error("Failed to emit order socket notification:", err.message),
    );

  return order;
};

export const deleteOrder = async (id) => {
  const order = await orderRepository.findById(id);
  if (!order) {
    throw new AppError("Đơn hàng không tồn tại", 404);
  }

  await restoreOrderStock(order);

  const deleted = await orderRepository.findByIdAndDelete(id);
  return deleted;
};
