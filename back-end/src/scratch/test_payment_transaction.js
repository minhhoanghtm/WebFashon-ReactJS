import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { Order } from '../modules/orders/order.model.js';
import PaymentTransaction from '../modules/payments/paymentTransaction.model.js';
import orderFacade from '../modules/orders/order.facade.js';

async function test() {
  const uri = process.env.MONGO_CONNECTIONSTRING || "mongodb://localhost:27017/REACT-WebFashion";
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
      full_name: "Transaction Tester",
      phone: "0912345678",
      city: "Cần Thơ",
      district: "Ninh Kiều",
      ward: "An Khánh",
      address_detail: "789 Nguyễn Văn Cừ"
    }
  });
  console.log(`Created mock order ${order._id} for transaction logging test.`);

  try {
    // Simulate vnpay success callback logic
    console.log("\n--- Simulating VNPay Return Success ---");
    const vnpayQuery = {
      vnp_TxnRef: order._id.toString(),
      vnp_ResponseCode: "00",
      vnp_Amount: "15000000", // 150,000 VND
      vnp_TransactionNo: "VNPAY123456"
    };

    // 1. Ghi transaction trước
    const txn = await PaymentTransaction.create({
      order_id: vnpayQuery.vnp_TxnRef,
      provider: "vnpay",
      transaction_id: vnpayQuery.vnp_TransactionNo,
      amount: Number(vnpayQuery.vnp_Amount) / 100,
      status: "success",
      raw_response: vnpayQuery
    });
    console.log(`Transaction logged: ${txn._id}`);

    // 2. Cập nhật Order sau
    await orderFacade.paymentCallback(vnpayQuery.vnp_TxnRef, "success", vnpayQuery.vnp_TransactionNo);

    // Verify DB records
    const verifiedTxn = await PaymentTransaction.findOne({ order_id: order._id });
    const verifiedOrder = await Order.findById(order._id);

    console.log("Txn Provider:", verifiedTxn.provider, "(Expected: vnpay)");
    console.log("Txn Amount:", verifiedTxn.amount, "(Expected: 150000)");
    console.log("Txn Status:", verifiedTxn.status, "(Expected: success)");
    console.log("Order Payment Status:", verifiedOrder.payment_status, "(Expected: paid)");
    console.log("Order Status:", verifiedOrder.status, "(Expected: confirmed)");

    if (
      verifiedTxn.status === "success" &&
      verifiedTxn.amount === 150000 &&
      verifiedOrder.payment_status === "paid" &&
      verifiedOrder.status === "confirmed"
    ) {
      console.log("✅ SUCCESS: VNPay PaymentTransaction and Order successfully updated!");
    } else {
      console.log("❌ FAIL: Verification failed!");
    }

  } finally {
    // Clean up
    console.log("\n--- Cleaning Up ---");
    await PaymentTransaction.deleteMany({ order_id: order._id });
    await Order.deleteOne({ _id: order._id });
    console.log("Cleaned up successfully.");
  }

  await mongoose.disconnect();
}

test().catch(console.error);
