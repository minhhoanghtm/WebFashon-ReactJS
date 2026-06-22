import * as orderQueries from "./queries/order.query.js";
import { createOrder, paymentOrder } from "./commands/createOrder.command.js";
import { cancelExpiredOrder, deleteOrder, restoreOrderStock } from "./commands/cancelOrder.command.js";
import {
  updateOrder,
  updateOrderStatus,
  paymentCallback,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem
} from "./commands/updateOrderStatus.command.js";

class OrderFacade {
  // Queries
  async getOrderDetail(orderId) {
    return await orderQueries.getOrderDetail(orderId);
  }

  async getOrderItemsByOrderId(orderId) {
    return await orderQueries.getOrderDetail(orderId);
  }

  async getMyOrders(userId) {
    return await orderQueries.getMyOrders(userId);
  }

  async getOrdersByUser(userId) {
    return await orderQueries.getMyOrders(userId);
  }

  async getAllOrders(options) {
    return await orderQueries.getAllOrders(options);
  }

  async getAdminOrders(options) {
    return await orderQueries.getAllOrders(options);
  }

  async getKPIs() {
    return await orderQueries.getKPIs();
  }

  async getRevenueOverview(type) {
    return await orderQueries.getRevenueOverview(type);
  }

  async getOrderStats(userId) {
    return await orderQueries.getOrderStats(userId);
  }

  async getPurchasePerformance() {
    return await orderQueries.getPurchasePerformance();
  }

  // Commands
  async createOrder(userId, orderData) {
    return await createOrder(userId, orderData);
  }

  async paymentOrder(userId, orderId, payment_method) {
    return await paymentOrder(userId, orderId, payment_method);
  }

  async cancelExpiredOrder(orderId) {
    return await cancelExpiredOrder(orderId);
  }

  async deleteOrder(id) {
    return await deleteOrder(id);
  }

  async restoreOrderStock(order, session = null) {
    return await restoreOrderStock(order, session);
  }

  async updateOrder(id, orderBody) {
    return await updateOrder(id, orderBody);
  }

  async updateOrderStatus(id, status) {
    return await updateOrderStatus(id, status);
  }

  async paymentCallback(orderId, status, transactionId) {
    return await paymentCallback(orderId, status, transactionId);
  }

  // Order Items
  async createOrderItem(itemData) {
    return await createOrderItem(itemData);
  }

  async updateOrderItem(id, itemData) {
    return await updateOrderItem(id, itemData);
  }

  async deleteOrderItem(id) {
    return await deleteOrderItem(id);
  }
}

export default new OrderFacade();
