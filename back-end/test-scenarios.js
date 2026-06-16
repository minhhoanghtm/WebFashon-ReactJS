import mongoose from "mongoose";
import dotenv from "dotenv";
import voucherService from "file:///d:/Project/REACT-404Studio/back-end/src/modules/vouchers/voucher.service.js";
import voucherRepository from "file:///d:/Project/REACT-404Studio/back-end/src/modules/vouchers/voucher.repository.js";
import orderService from "file:///d:/Project/REACT-404Studio/back-end/src/modules/orders/order.service.js";
import orderRepository from "file:///d:/Project/REACT-404Studio/back-end/src/modules/orders/order.repository.js";
import paymentService from "file:///d:/Project/REACT-404Studio/back-end/src/modules/payments/payment.service.js";

// Models for cleanup and assertions
import Voucher from "file:///d:/Project/REACT-404Studio/back-end/src/modules/vouchers/voucher.model.js";
import UserVoucher from "file:///d:/Project/REACT-404Studio/back-end/src/modules/vouchers/userVoucher.model.js";
import VoucherUsage from "file:///d:/Project/REACT-404Studio/back-end/src/modules/vouchers/voucherUsage.model.js";
import Product from "file:///d:/Project/REACT-404Studio/back-end/src/modules/products/product.model.js";
import { Order, OrderItem } from "file:///d:/Project/REACT-404Studio/back-end/src/modules/orders/order.model.js";

import { connectDB } from "file:///d:/Project/REACT-404Studio/back-end/src/configs/db.js";

dotenv.config({ path: "d:/Project/REACT-404Studio/back-end/.env" });

async function run() {
  console.log("Connecting to Database...");
  await connectDB();
  console.log("Connected to Database.");

  const results = [];

  const addResult = (testName, passed, details) => {
    results.push({ testName, status: passed ? "PASSED" : "FAILED", details });
    console.log(`[${passed ? "PASSED" : "FAILED"}] ${testName}: ${details}`);
  };

  try {
    // ----------------------------------------------------
    // TEST 1: Concurrency - 2 users claim 1 voucher
    // ----------------------------------------------------
    console.log("\n--- Running Test 1: Concurrency - 2 users claiming 1 remaining voucher slot ---");
    const code1 = `CONCUR1_${Date.now()}`;
    const voucher1 = await Voucher.create({
      code: code1,
      name: "Test Concurrency Claim",
      discountType: "fixed",
      discountValue: 10000,
      totalQuantity: 1,
      remainingQuantity: 1,
      startDate: new Date(Date.now() - 3600000), // active
      endDate: new Date(Date.now() + 3600000),
      status: "ACTIVE"
    });

    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();

    // Call claimVoucher concurrently
    const [resA, resB] = await Promise.allSettled([
      voucherService.claimVoucher(userA, voucher1._id),
      voucherService.claimVoucher(userB, voucher1._id)
    ]);

    const claimA_success = resA.status === "fulfilled";
    const claimB_success = resB.status === "fulfilled";

    const updatedV1 = await Voucher.findById(voucher1._id);
    const claimedVouchersCount = await UserVoucher.countDocuments({ voucherId: voucher1._id });

    // Assert only one succeeded, one failed
    if ((claimA_success && !claimB_success) || (!claimA_success && claimB_success)) {
      if (updatedV1.remainingQuantity === 0 && claimedVouchersCount === 1) {
        addResult("2 users claim 1 voucher", true, `Only one claim succeeded, remainingQuantity is 0, claims count is 1.`);
      } else {
        addResult("2 users claim 1 voucher", false, `Voucher state mismatch: remaining=${updatedV1.remainingQuantity}, claimedCount=${claimedVouchersCount}`);
      }
    } else {
      addResult("2 users claim 1 voucher", false, `A success: ${claimA_success}, B success: ${claimB_success}. Expected exactly one to succeed.`);
    }

    // Clean up Test 1
    await Voucher.deleteOne({ _id: voucher1._id });
    await UserVoucher.deleteMany({ voucherId: voucher1._id });

    // ----------------------------------------------------
    // TEST 2: Concurrency - 2 users checkout 1 remaining usage limit
    // ----------------------------------------------------
    console.log("\n--- Running Test 2: Concurrency - 2 users checking out voucher near usage limit ---");
    const code2 = `CONCUR2_${Date.now()}`;
    const voucher2 = await Voucher.create({
      code: code2,
      name: "Test Concurrency Checkout",
      discountType: "fixed",
      discountValue: 10000,
      totalQuantity: 2,
      remainingQuantity: 2,
      usedQuantity: 1, // 1 usage already done, so only 1 slot remains
      startDate: new Date(Date.now() - 3600000),
      endDate: new Date(Date.now() + 3600000),
      status: "ACTIVE"
    });

    // Claim for user A & B
    const userWalletA = await UserVoucher.create({ userId: userA, voucherId: voucher2._id, status: "CLAIMED" });
    const userWalletB = await UserVoucher.create({ userId: userB, voucherId: voucher2._id, status: "CLAIMED" });

    // Concurrent checkout/applyVoucher inside session
    let resCheckoutA, resCheckoutB;
    const [applyA, applyB] = await Promise.allSettled([
      voucherService.applyVoucherWithPlaceholder(userA, code2, 10000),
      voucherService.applyVoucherWithPlaceholder(userB, code2, 10000)
    ]);
    resCheckoutA = applyA;
    resCheckoutB = applyB;

    const checkoutA_success = resCheckoutA.status === "fulfilled";
    const checkoutB_success = resCheckoutB.status === "fulfilled";

    const updatedV2 = await Voucher.findById(voucher2._id);
    const usageCountV2 = await VoucherUsage.countDocuments({ voucherId: voucher2._id });

    if ((checkoutA_success && !checkoutB_success) || (!checkoutA_success && checkoutB_success)) {
      if (updatedV2.usedQuantity === 2 && usageCountV2 === 1) {
        addResult("2 users checkout voucher near limit", true, `Only one checkout succeeded, usedQuantity reached limit (2), usage records created = 1.`);
      } else {
        addResult("2 users checkout voucher near limit", false, `Voucher state mismatch: usedQuantity=${updatedV2.usedQuantity}, usageCount=${usageCountV2}`);
      }
    } else {
      addResult("2 users checkout voucher near limit", false, `A success: ${checkoutA_success}, B success: ${checkoutB_success}. Expected exactly one to succeed.`);
    }

    // Clean up Test 2
    await Voucher.deleteOne({ _id: voucher2._id });
    await UserVoucher.deleteMany({ voucherId: voucher2._id });
    await VoucherUsage.deleteMany({ voucherId: voucher2._id });


    // ----------------------------------------------------
    // TEST 3: Rollback - Rollback transaction when OrderItem insertion fails
    // ----------------------------------------------------
    console.log("\n--- Running Test 3: Transaction Rollback when OrderItem fails ---");
    const code3 = `ROLLBACK1_${Date.now()}`;
    const voucher3 = await Voucher.create({
      code: code3,
      name: "Test Rollback OrderItem",
      discountType: "fixed",
      discountValue: 10000,
      totalQuantity: 10,
      remainingQuantity: 10,
      usedQuantity: 0,
      startDate: new Date(Date.now() - 3600000),
      endDate: new Date(Date.now() + 3600000),
      status: "ACTIVE"
    });

    const userC = new mongoose.Types.ObjectId();
    await UserVoucher.create({ userId: userC, voucherId: voucher3._id, status: "CLAIMED" });

    // Create a real test product to pass first stage of validation
    const testProduct3 = await Product.create({
      name: "Test Rollback Product",
      category_id: new mongoose.Types.ObjectId(),
      slug: `test-rollback-product-3-${Date.now()}`,
      old_price: 150000,
      new_price: 120000
    });

    // Mock insertManyItems to fail
    const originalInsertMany = orderRepository.insertManyItems;
    orderRepository.insertManyItems = async () => {
      throw new Error("MOCKED_ORDER_ITEMS_INSERTION_FAILURE");
    };

    let checkoutError = null;
    try {
      await orderService.createOrder(userC, {
        items: [{ product_id: testProduct3._id, quantity: 1 }],
        paymentMethod: "cod",
        shippingAddress: "Test Address",
        voucherCode: code3
      });
    } catch (err) {
      checkoutError = err;
    }

    // Restore original method
    orderRepository.insertManyItems = originalInsertMany;

    // Verify DB state
    const afterV3 = await Voucher.findById(voucher3._id);
    const afterUV3 = await UserVoucher.findOne({ userId: userC, voucherId: voucher3._id });
    const usageCountV3 = await VoucherUsage.countDocuments({ voucherId: voucher3._id });
    const ordersCountC = await Order.countDocuments({ user_id: userC });

    if (checkoutError && checkoutError.message === "MOCKED_ORDER_ITEMS_INSERTION_FAILURE") {
      if (afterV3.usedQuantity === 0 && afterUV3.status === "CLAIMED" && usageCountV3 === 0 && ordersCountC === 0) {
        addResult("Rollback when OrderItem fails", true, `Transaction fully rolled back: voucher usedCount=0, wallet status=CLAIMED, usages=0, orders=0.`);
      } else {
        addResult("Rollback when OrderItem fails", false, `State mismatch after rollback: voucherUsed=${afterV3.usedQuantity}, walletStatus=${afterUV3.status}, usages=${usageCountV3}, orders=${ordersCountC}`);
      }
    } else {
      addResult("Rollback when OrderItem fails", false, `Expected checkout to fail with MOCKED_ORDER_ITEMS_INSERTION_FAILURE, got: ${checkoutError?.message || checkoutError}`);
    }

    // Clean up Test 3
    await Voucher.deleteOne({ _id: voucher3._id });
    await UserVoucher.deleteMany({ voucherId: voucher3._id });
    await VoucherUsage.deleteMany({ voucherId: voucher3._id });
    await Product.deleteOne({ _id: testProduct3._id });
    await Order.deleteMany({ user_id: userC });


    // ----------------------------------------------------
    // TEST 4: Rollback - Rollback transaction when applyVoucher fails
    // ----------------------------------------------------
    console.log("\n--- Running Test 4: Transaction Rollback when applyVoucher fails ---");
    const code4 = `ROLLBACK2_${Date.now()}`;
    const voucher4 = await Voucher.create({
      code: code4,
      name: "Test Rollback ApplyVoucher",
      discountType: "fixed",
      discountValue: 10000,
      totalQuantity: 10,
      remainingQuantity: 10,
      usedQuantity: 0,
      startDate: new Date(Date.now() - 3600000),
      endDate: new Date(Date.now() + 3600000),
      status: "ACTIVE"
    });

    const userD = new mongoose.Types.ObjectId();
    // Intentionally create a dummy UserVoucher record for userD's wallet so count > 0 (prevents auto-seeding)
    // but userD does not own voucher4, so applyVoucher/validateVoucher still fails as intended
    await UserVoucher.create({
      userId: userD,
      voucherId: new mongoose.Types.ObjectId(),
      status: "CLAIMED"
    });

    // Create a real test product to pass first stage of validation
    const testProduct4 = await Product.create({
      name: "Test Rollback Product",
      category_id: new mongoose.Types.ObjectId(),
      slug: `test-rollback-product-4-${Date.now()}`,
      old_price: 150000,
      new_price: 120000
    });

    let applyError = null;
    try {
      await orderService.createOrder(userD, {
        items: [{ product_id: testProduct4._id, quantity: 1 }],
        paymentMethod: "cod",
        shippingAddress: "Test Address",
        voucherCode: code4
      });
    } catch (err) {
      applyError = err;
    }

    // Verify DB state
    const afterV4 = await Voucher.findById(voucher4._id);
    const usageCountV4 = await VoucherUsage.countDocuments({ voucherId: voucher4._id });
    const ordersCountD = await Order.countDocuments({ user_id: userD });

    if (applyError && applyError.message.includes("Bạn chưa sở hữu voucher")) {
      if (afterV4.usedQuantity === 0 && usageCountV4 === 0 && ordersCountD === 0) {
        addResult("Rollback when applyVoucher fails", true, `Transaction fully rolled back: voucher usedCount=0, usages=0, orders=0.`);
      } else {
        addResult("Rollback when applyVoucher fails", false, `State mismatch after rollback: voucherUsed=${afterV4.usedQuantity}, usages=${usageCountV4}, orders=${ordersCountD}`);
      }
    } else {
      addResult("Rollback when applyVoucher fails", false, `Expected checkout to fail with owner check error, got: ${applyError?.message || applyError}`);
    }

    // Clean up Test 4
    await Voucher.deleteOne({ _id: voucher4._id });
    await UserVoucher.deleteMany({ userId: userD });
    await VoucherUsage.deleteMany({ voucherId: voucher4._id });
    await Product.deleteOne({ _id: testProduct4._id });
    await Order.deleteMany({ user_id: userD });


    // ----------------------------------------------------
    // TEST 5: Payments - Callback sent multiple times consecutively
    // ----------------------------------------------------
    console.log("\n--- Running Test 5: Payment Callback sent multiple times consecutively ---");
    const userE = new mongoose.Types.ObjectId();
    const order5 = await Order.create({
      user_id: userE,
      total_price: 150000,
      payment_method: "momo",
      shipping_address: {
        full_name: "Test User",
        phone: "0901234567",
        city: "Hanoi",
        district: "Cau Giay",
        ward: "Dich Vong",
        address_detail: "Test Address"
      },
      payment_status: "pending",
      status: "pending"
    });

    // Send first callback
    const resCallback1 = await paymentService.handleCallback(order5._id, "success", "TRANS_ID_123");
    const paidAtTime1 = resCallback1.paid_at.getTime();

    // Wait 100ms
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Send second callback
    const resCallback2 = await paymentService.handleCallback(order5._id, "success", "TRANS_ID_123");
    const paidAtTime2 = resCallback2.paid_at.getTime();

    if (resCallback1.payment_status === "paid" && resCallback2.payment_status === "paid" && paidAtTime1 === paidAtTime2) {
      addResult("Payment callback sent multiple times", true, `Idempotency verified: paid_at timestamp matches exactly, state was not overwritten.`);
    } else {
      addResult("Payment callback sent multiple times", false, `paid_at mismatch: time1=${paidAtTime1}, time2=${paidAtTime2}`);
    }

    // Clean up Test 5
    await Order.deleteOne({ _id: order5._id });


    // ----------------------------------------------------
    // TEST 6: Payments - Callback sent after order is already paid
    // ----------------------------------------------------
    console.log("\n--- Running Test 6: Payment Callback sent after order is already paid ---");
    const order6 = await Order.create({
      user_id: userE,
      total_price: 200000,
      payment_method: "momo",
      shipping_address: {
        full_name: "Test User",
        phone: "0901234567",
        city: "Hanoi",
        district: "Cau Giay",
        ward: "Dich Vong",
        address_detail: "Test Address"
      },
      payment_status: "paid",
      paid_at: new Date(Date.now() - 3600000), // 1 hour ago
      status: "confirmed",
      transaction_id: "TRANS_ORIGINAL"
    });

    const originalPaidAt = order6.paid_at.getTime();

    // Call payment callback with different transaction ID and success status
    const resCallback6 = await paymentService.handleCallback(order6._id, "success", "TRANS_NEW");

    if (resCallback6.payment_status === "paid" && resCallback6.transaction_id === "TRANS_ORIGINAL" && resCallback6.paid_at.getTime() === originalPaidAt) {
      addResult("Payment callback after paid", true, `Ignored: paid_at and transaction_id kept original values.`);
    } else {
      addResult("Payment callback after paid", false, `Modified: transaction_id=${resCallback6.transaction_id}, paid_at=${resCallback6.paid_at}`);
    }

    // Clean up Test 6
    await Order.deleteOne({ _id: order6._id });

  } catch (error) {
    console.error("Test execution failed with error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from Database.");

    console.log("\n==================================================");
    console.log("Summary of all tests:");
    results.forEach((r) => {
      console.log(`[${r.status}] ${r.testName}: ${r.details}`);
    });
    console.log("==================================================\n");
  }
}

run();
