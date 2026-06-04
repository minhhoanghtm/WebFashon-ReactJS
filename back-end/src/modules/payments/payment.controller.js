import paymentService from "./payment.service.js";
import { successResponse } from "../../common/responses/index.js";

export const processPayment = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId, payment_method } = req.body;
    const result = await paymentService.processPayment(userId, orderId, payment_method);

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

export const handleCallback = async (req, res, next) => {
  try {
    const { orderId, status, transactionId } = req.query;
    const order = await paymentService.handleCallback(orderId, status, transactionId);

    return res.redirect(
      `${process.env.CLIENT_URL}/orders?paymentStatus=${order.payment_status}`
    );
  } catch (error) {
    next(error);
  }
};
