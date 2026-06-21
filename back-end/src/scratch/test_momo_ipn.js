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
    sentEmpty: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
    send(data) {
      this.sentEmpty = true;
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
    payment_method: "momo",
    shipping_address: {
      full_name: "MoMo Tester",
      phone: "0912345678",
      city: "Cần Thơ",
      district: "Ninh Kiều",
      ward: "An Khánh",
      address_detail: "789 Nguyễn Văn Cừ"
    }
  });
  console.log(`Created mock order ${order._id} for MoMo IPN test.`);

  // Save original verifyReturn
  const originalVerifyReturn = paymentService.verifyMomoReturn;

  try {
    // 1. Test Case 1: Invalid checksum
    console.log("\n--- Test Case 1: Invalid Signature (Expect Status 400) ---");
    paymentService.verifyMomoReturn = () => false; // Force invalid
    
    const req1 = {
      body: { orderId: `${order._id}_12345` }
    };
    const res1 = createMockResponse();
    
    await paymentController.momoIpn(req1, res1, () => {});
    console.log(`Response Code: ${res1.statusCode}, Body:`, res1.jsonData);
    if (res1.statusCode === 400 && res1.jsonData && res1.jsonData.message === "Invalid payment signature") {
      console.log("✅ SUCCESS: Case 1 Passed!");
    } else {
      console.log("❌ FAIL: Case 1 Failed!");
    }

    // Restore verifyReturn for other tests
    paymentService.verifyMomoReturn = () => true;

    // 2. Test Case 2: Order Not Found (Expect Status 404)
    console.log("\n--- Test Case 2: Order Not Found (Expect Status 404) ---");
    const fakeOrderId = new mongoose.Types.ObjectId().toString();
    const req2 = {
      body: { orderId: `${fakeOrderId}_12345` }
    };
    const res2 = createMockResponse();
    
    await paymentController.momoIpn(req2, res2, () => {});
    console.log(`Response Code: ${res2.statusCode}, Body:`, res2.jsonData);
    if (res2.statusCode === 404) {
      console.log("✅ SUCCESS: Case 2 Passed!");
    } else {
      console.log("❌ FAIL: Case 2 Failed!");
    }

    // 3. Test Case 3: Invalid Amount (Expect Status 400)
    console.log("\n--- Test Case 3: Invalid Amount (Expect Status 400) ---");
    const req3 = {
      body: {
        orderId: `${order._id}_12345`,
        amount: 200000 // 200k instead of 150k
      }
    };
    const res3 = createMockResponse();
    
    await paymentController.momoIpn(req3, res3, () => {});
    console.log(`Response Code: ${res3.statusCode}, Body:`, res3.jsonData);
    if (res3.statusCode === 400) {
      console.log("✅ SUCCESS: Case 3 Passed!");
    } else {
      console.log("❌ FAIL: Case 3 Failed!");
    }

    // 4. Test Case 4: Confirm Success (Expect Status 204)
    console.log("\n--- Test Case 4: Confirm Success (Expect Status 204) ---");
    const req4 = {
      body: {
        orderId: `${order._id}_12345`,
        amount: 150000,
        resultCode: 0,
        transId: "MOMOIPN789"
      }
    };
    const res4 = createMockResponse();
    
    await paymentController.momoIpn(req4, res4, () => {});
    console.log(`Response Code: ${res4.statusCode}, Sent Empty: ${res4.sentEmpty}`);
    
    // Verify DB
    const txn = await PaymentTransaction.findOne({ order_id: order._id });
    const updatedOrder = await Order.findById(order._id);
    console.log("Transaction created:", !!txn);
    console.log("Order Payment Status:", updatedOrder.payment_status, "(Expected: paid)");
    console.log("Order Status:", updatedOrder.status, "(Expected: confirmed)");

    if (res4.statusCode === 204 && txn && txn.status === "success" && updatedOrder.payment_status === "paid" && updatedOrder.status === "confirmed") {
      console.log("✅ SUCCESS: Case 4 Passed!");
    } else {
      console.log("❌ FAIL: Case 4 Failed!");
    }

    // 5. Test Case 5: Already Confirmed (Expect Status 204)
    console.log("\n--- Test Case 5: Already Confirmed (Expect Status 204) ---");
    const req5 = {
      body: {
        orderId: `${order._id}_12345`,
        amount: 150000,
        resultCode: 0,
        transId: "MOMOIPN789"
      }
    };
    const res5 = createMockResponse();
    
    await paymentController.momoIpn(req5, res5, () => {});
    console.log(`Response Code: ${res5.statusCode}, Sent Empty: ${res5.sentEmpty}`);
    if (res5.statusCode === 204) {
      console.log("✅ SUCCESS: Case 5 Passed!");
    } else {
      console.log("❌ FAIL: Case 5 Failed!");
    }

  } finally {
    // Restore verifyReturn
    paymentService.verifyMomoReturn = originalVerifyReturn;

    // Clean up
    console.log("\n--- Cleaning Up ---");
    await PaymentTransaction.deleteMany({ order_id: order._id });
    await Order.deleteOne({ _id: order._id });
    console.log("Cleaned up successfully.");
  }

  await mongoose.disconnect();
}

test().catch(console.error);
