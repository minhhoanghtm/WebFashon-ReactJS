import Order from "../orders/order.model.js";
import paymentService from "./payment.service.js";
import orderFacade from "../orders/order.facade.js";
import PaymentTransaction from "./paymentTransaction.model.js";

class PaymentController {
  async createVNPayPayment(req, res, next) {
    try {
      const { orderId } = req.params;
      const ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

      const paymentUrl = await paymentService.createVNPayPayment(orderId, ipAddr);
      return res.json({ success: true, paymentUrl });
    } catch (error) {
      next(error);
    }
  }

  async vnpayReturn(req, res, next) {
    try {
      const query = { ...req.query };
      const isValid = paymentService.verifyVNPayReturn(query);

      const isSuccess = req.query.vnp_ResponseCode === "00";
      const rawTxnRef = req.query.vnp_TxnRef || "";
      const orderId = rawTxnRef.split("_")[0];
      const amount = Number(req.query.vnp_Amount || 0) / 100;
      const txnNo = req.query.vnp_TransactionNo || null;

      if (isValid && orderId) {
        const order = await Order.findById(orderId);
        if (order && order.payment_status !== "paid") {
          if (Math.abs(order.total_price - amount) <= 1) {
            const existingTxn = await PaymentTransaction.findOne({ order_id: orderId, transaction_id: txnNo });
            if (!existingTxn) {
              await PaymentTransaction.create({
                order_id: orderId,
                provider: "vnpay",
                transaction_id: txnNo,
                amount: amount,
                status: isSuccess ? "success" : "failed",
                raw_response: req.query,
              });
            }

            if (isSuccess) {
              await orderFacade.paymentCallback(orderId, "success", txnNo);
            } else {
              await orderFacade.paymentCallback(orderId, "failed", null);
            }
          }
        }
      }

      const paymentStatus = isSuccess ? "paid" : "failed";
      return res.redirect(`${process.env.FRONTEND_URL}/orders?paymentStatus=${paymentStatus}`);
    } catch (error) {
      next(error);
    }
  }

  async vnpayIpn(req, res, next) {
    try {
      // 1. Copy query object to avoid mutation issues during signature verification
      const query = { ...req.query };
      const isValid = paymentService.verifyVNPayReturn(query);

      if (!isValid) {
        return res.status(200).json({ RspCode: "97", Message: "Invalid checksum" });
      }

      const rawTxnRef = req.query.vnp_TxnRef || "";
      const orderId = rawTxnRef.split("_")[0];
      const amount = Number(req.query.vnp_Amount || 0) / 100;
      const isSuccess = req.query.vnp_ResponseCode === "00";
      const txnNo = req.query.vnp_TransactionNo || null;

      // 2. Find order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(200).json({ RspCode: "01", Message: "Order not found" });
      }

      // 3. Verify amount
      if (Math.abs(order.total_price - amount) > 1) { // Allow tiny decimal variance
        return res.status(200).json({ RspCode: "04", Message: "Amount invalid" });
      }

      // 4. Check if already processed
      if (order.payment_status === "paid") {
        return res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
      }

      // 5. Log PaymentTransaction first
      await PaymentTransaction.create({
        order_id: orderId,
        provider: "vnpay",
        transaction_id: txnNo,
        amount: amount,
        status: isSuccess ? "success" : "failed",
        raw_response: req.query,
      });

      // 6. Update Order status
      if (isSuccess) {
        await orderFacade.paymentCallback(orderId, "success", txnNo);
      } else {
        await orderFacade.paymentCallback(orderId, "failed", null);
      }

      return res.status(200).json({ RspCode: "00", Message: "Confirm success" });
    } catch (error) {
      console.error("VNPay IPN Error:", error);
      return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
  }

  async createMomoPayment(req, res, next) {
    try {
      const {orderId} = req.params;
      const result = await paymentService.createMomoPayment(orderId);
      return res.json({ success: true, paymentUrl: result.payUrl });
    } catch (error) {
      next(error);
    }
  }

  async momoReturn(req, res, next) {
    try {
      const query = { ...req.query };
      const isValid = paymentService.verifyMomoReturn(query);

      const isSuccess = req.query.resultCode === "0";
      const rawOrderId = req.query.orderId || "";
      const orderId = rawOrderId.split('_')[0];
      const amount = Number(req.query.amount || 0);
      const transId = req.query.transId || null;

      if (isValid && orderId) {
        const order = await Order.findById(orderId);
        if (order && order.payment_status !== "paid") {
          if (Math.abs(order.total_price - amount) <= 1) {
            const existingTxn = await PaymentTransaction.findOne({ order_id: orderId, transaction_id: transId });
            if (!existingTxn) {
              await PaymentTransaction.create({
                order_id: orderId,
                provider: "momo",
                transaction_id: transId,
                amount: amount,
                status: isSuccess ? "success" : "failed",
                raw_response: req.query,
              });
            }

            if (isSuccess) {
              await orderFacade.paymentCallback(orderId, "success", transId);
            } else {
              await orderFacade.paymentCallback(orderId, "failed", null);
            }
          }
        }
      }

      const paymentStatus = isSuccess ? "paid" : "failed";
      return res.redirect(`${process.env.FRONTEND_URL}/orders?paymentStatus=${paymentStatus}`);
    } catch (error) {
      next(error);
    }
  }

/**
 * MoMo IPN Compliance
 * Always return HTTP 200.
 * Business status is represented by resultCode.
 * Prevents MoMo retry storm.
 */
  async momoIpn(req, res, next) {
    try {
      const isValid = paymentService.verifyMomoReturn(req.body);

      if (!isValid) {
        return res.status(200).json({
          success: false,
          resultCode: 97,
          message: "Invalid payment signature",
        });
      }

      const rawOrderId = req.body.orderId || "";
      const orderid = rawOrderId.split('_')[0];
      const amount = Number(req.body.amount || 0);
      const isSuccess = req.body.resultCode === 0;
      const transId = req.body.transId || null;

      // 2. Find order
      const order = await Order.findById(orderid);
      if (!order) {
        return res.status(200).json({
          success: false,
          resultCode: 98,
          message: "Order not found",
        });
      }

      // 3. Verify amount
      if (Math.abs(order.total_price - amount) > 1) {
        return res.status(200).json({
          success: false,
          resultCode: 97,
          message: "Amount invalid",
        });
      }

      // 4. Check if already processed
      if (order.payment_status === "paid") {
        return res.status(200).json({
          success: true,
          resultCode: 0,
          message: "Order already processed",
        });
      }

      // 5. Log PaymentTransaction first
      await PaymentTransaction.create({
        order_id: orderid,
        provider: "momo",
        transaction_id: transId,
        amount: amount,
        status: isSuccess ? "success" : "failed",
        raw_response: req.body,
      });

      // 6. Update Order status
      if (isSuccess) {
        await orderFacade.paymentCallback(orderid, "success", transId);
      } else {
        await orderFacade.paymentCallback(orderid, "failed", null);
      }

      return res.status(200).json({
        success: true,
        resultCode: 0,
        message: "Success",
      });
    } catch (error) {
      console.error("MoMo IPN Error:", error);
      return res.status(200).json({
        success: false,
        resultCode: 99,
        message: "Internal server error",
      });
    }
  }
}

export default new PaymentController();