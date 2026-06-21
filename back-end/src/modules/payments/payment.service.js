import momoProvider from "../../providers/momo.provider.js";
import vnpayProvider from "../../providers/vnpay.provider.js";
import Order from "../orders/order.model.js";
class PaymentService {
  async createVNPayPayment(orderId, ipAddress) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    const paymanrtUrl = await vnpayProvider.createPaymantUrl(order, ipAddress);
    return paymanrtUrl;
  }

  async createMomoPayment(orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    const result = await momoProvider.createPayment(order);
    return result;
  }

  verifyVNPayReturn(query) {
    return vnpayProvider.verifyReturn(query);
  }

  verifyMomoReturn(query) {
    return momoProvider.verifyReturn(query);
  }
}

export default new PaymentService();