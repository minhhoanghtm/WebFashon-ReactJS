import orderRepository from "../orders/order.repository.js";
import { AppError } from "../../common/exceptions/AppError.js";
import * as momoProvider from "../../providers/momo.provider.js";
import * as stripeProvider from "../../providers/stripe.provider.js";
import * as zalopayProvider from "../../providers/zalopay.provider.js";
import dotenv from "dotenv";
dotenv.config();

class PaymentService {
  async processPayment(userId, orderId, paymentMethod) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Đơn hàng không tồn tại", 404);
    }
    if (order.user_id.toString() !== userId) {
      throw new AppError("Bạn không có quyền thanh toán đơn hàng này", 403);
    }
    if (order.payment_status === "paid") {
      throw new AppError("Đơn hàng đã được thanh toán.", 400);
    }

    if (paymentMethod === "cod") {
      order.payment_method = "cod";
      order.payment_status = "pending";
      order.status = "confirmed";
      await order.save();
      return {
        success: true,
        message: "Đơn hàng đã được đặt thành công. Vui lòng chuẩn bị tiền mặt khi nhận hàng.",
        order,
      };
    }

    if (paymentMethod === "momo") {
      order.payment_method = "momo";
      order.payment_status = "pending";
      await order.save();

      const result = await momoProvider.createMomoPayment(order._id, order.total_price);
      return { success: true, message: "Chuyển đến cổng thanh toán", paymentUrl: result.paymentUrl, order };
    }

    if (paymentMethod === "zalopay") {
      order.payment_method = "zalopay";
      order.payment_status = "pending";
      await order.save();

      const result = await zalopayProvider.createZaloPayPayment(order._id, order.total_price);
      return { success: true, message: "Chuyển đến cổng thanh toán", paymentUrl: result.paymentUrl, order };
    }

    if (paymentMethod === "stripe") {
      order.payment_method = "stripe";
      order.payment_status = "pending";
      await order.save();

      const result = await stripeProvider.createStripePayment(order._id, order.total_price);
      return { success: true, message: "Chuyển đến cổng thanh toán", paymentUrl: result.paymentUrl, order };
    }

    if (paymentMethod === "vnpay") {
      order.payment_method = "vnpay";
      order.payment_status = "pending";
      await order.save();

      const paymentUrl = `${process.env.CLIENT_URL}/payment-success?orderId=${order._id}&provider=vnpay`;
      return { success: true, message: "Chuyển đến cổng thanh toán", paymentUrl, order };
    }

    throw new AppError("Phương thức thanh toán không hợp lệ", 400);
  }

  async handleCallback(orderId, status, transactionId) {
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
    return order;
  }
}

export default new PaymentService();
