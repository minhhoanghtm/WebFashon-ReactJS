import express from "express";
import paymentController from "./payment.controller.js";
import { protectedRoute, noAdmin } from "../../middlewares/auth.middleware.js";

const PaymentRouter = express.Router();

// VNPAY 
PaymentRouter.post('/vnpay/create/:orderId', protectedRoute, noAdmin, paymentController.createVNPayPayment);
PaymentRouter.get('/vnpay/return', paymentController.vnpayReturn);
PaymentRouter.get('/vnpay/ipn', paymentController.vnpayIpn);

// MOMO
PaymentRouter.post('/momo/create/:orderId', protectedRoute, noAdmin, paymentController.createMomoPayment);
PaymentRouter.get('/momo/return', paymentController.momoReturn);
PaymentRouter.post('/momo/ipn', paymentController.momoIpn);
export default PaymentRouter;