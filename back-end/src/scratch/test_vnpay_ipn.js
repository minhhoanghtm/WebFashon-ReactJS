import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import paymentController from '../modules/payments/payment.controller.js';
import paymentService from '../modules/payments/payment.service.js';
import { Order } from '../modules/orders/order.model.js';
import PaymentTransaction from '../modules/payments/paymentTransaction.model.js';

// Mock response helper
function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    }
  };
  return res;
}

async function test() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  await mongoose.connect(uri);
  console.log("Connected to MongoDB successfully.");

  // Seed mock order
  const mockUserId = new mongoose.Types.ObjectId();
  const order = await Order.create({
    user_id: mockUserId,
    total_price: 150000,
    original_price: 150000,
    status: "pending",
    payment_method: "vnpay",
    shipping_address: {
      full_name: "IPN Tester",
      phone: "0912345678",
      city: "Cần Thơ",
      district: "Ninh Kiều",
      ward: "An Khánh",
      address_detail: "789 Nguyễn Văn Cừ"
    }
  });
  console.log(`Created mock order ${order._id} for IPN test.`);

  // Save the original verifyReturn method
  const originalVerifyReturn = paymentService.verifyVNPayReturn;

  try {
    // 1. Test Case 1: Invalid checksum (RspCode 97)
    console.log("\n--- Test Case 1: Invalid Checksum (Expect RspCode: 97) ---");
    paymentService.verifyVNPayReturn = () => false; // Force invalid signature
    
    const req1 = {
      query: { vnp_TxnRef: order._id.toString() }
    };
    const res1 = createMockResponse();
    
    await paymentController.vnpayIpn(req1, res1, () => {});
    console.log("Response:", res1.jsonData);
    if (res1.jsonData && res1.jsonData.RspCode === "97") {
      console.log("✅ SUCCESS: Case 1 Passed!");
    } else {
      console.log("❌ FAIL: Case 1 Failed!");
    }

    // Restore verifyReturn for other tests
    paymentService.verifyVNPayReturn = () => true;

    // 2. Test Case 2: Order Not Found (RspCode 01)
    console.log("\n--- Test Case 2: Order Not Found (Expect RspCode: 01) ---");
    const fakeOrderId = new mongoose.Types.ObjectId().toString();
    const req2 = {
      query: { vnp_TxnRef: fakeOrderId }
    };
    const res2 = createMockResponse();
    
    await paymentController.vnpayIpn(req2, res2, () => {});
    console.log("Response:", res2.jsonData);
    if (res2.jsonData && res2.jsonData.RspCode === "01") {
      console.log("✅ SUCCESS: Case 2 Passed!");
    } else {
      console.log("❌ FAIL: Case 2 Failed!");
    }

    // 3. Test Case 3: Invalid Amount (RspCode 04)
    console.log("\n--- Test Case 3: Invalid Amount (Expect RspCode: 04) ---");
    const req3 = {
      query: {
        vnp_TxnRef: order._id.toString(),
        vnp_Amount: "20000000" // 200,000 VND instead of 150,000 VND
      }
    };
    const res3 = createMockResponse();
    
    await paymentController.vnpayIpn(req3, res3, () => {});
    console.log("Response:", res3.jsonData);
    if (res3.jsonData && res3.jsonData.RspCode === "04") {
      console.log("✅ SUCCESS: Case 3 Passed!");
    } else {
      console.log("❌ FAIL: Case 3 Failed!");
    }

    // 4. Test Case 4: Confirm Success (RspCode 00)
    console.log("\n--- Test Case 4: Confirm Success (Expect RspCode: 00) ---");
    const req4 = {
      query: {
        vnp_TxnRef: order._id.toString(),
        vnp_Amount: "15000000",
        vnp_ResponseCode: "00",
        vnp_TransactionNo: "VNPAYIPN789"
      }
    };
    const res4 = createMockResponse();
    
    await paymentController.vnpayIpn(req4, res4, () => {});
    console.log("Response:", res4.jsonData);
    
    // Verify DB
    const txn = await PaymentTransaction.findOne({ order_id: order._id });
    const updatedOrder = await Order.findById(order._id);
    console.log("Transaction created:", !!txn);
    console.log("Order Payment Status:", updatedOrder.payment_status, "(Expected: paid)");
    console.log("Order Status:", updatedOrder.status, "(Expected: confirmed)");

    if (
      res4.jsonData && res4.jsonData.RspCode === "00" && 
      txn && txn.status === "success" && 
      updatedOrder.payment_status === "paid" && updatedOrder.status === "confirmed"
    ) {
      console.log("✅ SUCCESS: Case 4 Passed!");
    } else {
      console.log("❌ FAIL: Case 4 Failed!");
    }

    // 5. Test Case 5: Already Confirmed (RspCode 02)
    console.log("\n--- Test Case 5: Already Confirmed (Expect RspCode: 02) ---");
    const req5 = {
      query: {
        vnp_TxnRef: order._id.toString(),
        vnp_Amount: "15000000",
        vnp_ResponseCode: "00",
        vnp_TransactionNo: "VNPAYIPN789"
      }
    };
    const res5 = createMockResponse();
    
    await paymentController.vnpayIpn(req5, res5, () => {});
    console.log("Response:", res5.jsonData);
    if (res5.jsonData && res5.jsonData.RspCode === "02") {
      console.log("✅ SUCCESS: Case 5 Passed!");
    } else {
      console.log("❌ FAIL: Case 5 Failed!");
    }

  } finally {
    // Restore verifyReturn
    paymentService.verifyVNPayReturn = originalVerifyReturn;

    // Clean up
    console.log("\n--- Cleaning Up ---");
    await PaymentTransaction.deleteMany({ order_id: order._id });
    await Order.deleteOne({ _id: order._id });
    console.log("Cleaned up successfully.");
  }

  await mongoose.disconnect();
}

test().catch(console.error);
