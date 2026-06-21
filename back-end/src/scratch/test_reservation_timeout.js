import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { Order, OrderItem } from '../modules/orders/order.model.js';
import { Product, ProductVariant } from '../modules/products/product.model.js';
import orderService from '../modules/orders/order.service.js';

async function test() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  await mongoose.connect(uri);
  console.log("Connected to MongoDB successfully.");

  // 1. Seed product & variant
  console.log("\n--- Seeding Test Data ---");
  const product = await Product.create({
    name: "Cron Test Product",
    slug: "cron-test-product-" + Date.now(),
    category_id: new mongoose.Types.ObjectId(),
    old_price: 100000,
    new_price: 80000,
    stock: 20,
    sold: 0,
    is_active: true,
  });

  const variant = await ProductVariant.create({
    product_id: product._id,
    color: "Black",
    size: "L",
    stock: 20,
    image_url: "http://example.com/black.jpg",
  });
  console.log(`Product stock initial: 20`);

  const userId = new mongoose.Types.ObjectId();

  // 2. Create two orders as if they were placed 20 minutes ago, already deducted
  const pastTime = new Date(Date.now() - 20 * 60 * 1000); // 20 min ago

  const [orderVnpay, orderMomo] = await Order.insertMany([
    {
      user_id: userId,
      total_price: 80000,
      original_price: 80000,
      status: "pending",
      payment_method: "vnpay",
      payment_status: "pending",
      stock_deducted: true,
      shipping_address: {
        full_name: "Cron Tester VNPay",
        phone: "0911111111",
        city: "HCM",
        district: "Q1",
        ward: "BN",
        address_detail: "1A Test Street",
      },
      createdAt: pastTime,
    },
    {
      user_id: userId,
      total_price: 80000,
      original_price: 80000,
      status: "pending",
      payment_method: "momo",
      payment_status: "failed",   // User already tried once and failed
      stock_deducted: true,
      shipping_address: {
        full_name: "Cron Tester MoMo",
        phone: "0922222222",
        city: "HN",
        district: "HK",
        ward: "TT",
        address_detail: "2B Test Road",
      },
      createdAt: pastTime,
    },
  ]);

  // Seed matching order items
  await OrderItem.insertMany([
    { order_id: orderVnpay._id, product_id: product._id, variant_id: variant._id, quantity: 3, price: 80000 },
    { order_id: orderMomo._id, product_id: product._id, variant_id: variant._id, quantity: 4, price: 80000 },
  ]);

  // Manually deduct stock to reflect "already reserved"
  await ProductVariant.updateOne({ _id: variant._id }, { $inc: { stock: -7 } });
  await Product.updateOne({ _id: product._id }, { $inc: { stock: -7, sold: 7 } });

  const stockAfterReserve = (await ProductVariant.findById(variant._id)).stock;
  console.log(`Stock after reservation (2 orders × qty): ${stockAfterReserve} (Expected: 13)`);

  try {
    // 3. Simulate cron logic: find expired orders and cancel via service
    console.log("\n--- Simulating Cron: Cancelling Expired Orders ---");
    const TIMEOUT_MS = 15 * 60 * 1000;
    const timeLimit = new Date(Date.now() - TIMEOUT_MS);

    const expiredOrders = await Order.find(
      {
        status: "pending",
        payment_method: { $in: ["vnpay", "momo"] },
        createdAt: { $lt: timeLimit },
        _id: { $in: [orderVnpay._id, orderMomo._id] }, // Scope to test orders
      },
      { _id: 1 }
    ).lean();

    console.log(`Found ${expiredOrders.length} expired orders (Expected: 2)`);

    for (const { _id } of expiredOrders) {
      await orderService.cancelExpiredOrder(_id);
      console.log(`Cancelled order ${_id}`);
    }

    // 4. Verify results
    console.log("\n--- Verifying Results ---");
    const [v1, v2] = await Promise.all([
      Order.findById(orderVnpay._id),
      Order.findById(orderMomo._id),
    ]);

    console.log(`VNPay order status: ${v1.status} (Expected: cancelled)`);
    console.log(`VNPay order payment_status: ${v1.payment_status} (Expected: failed)`);
    console.log(`VNPay order stock_deducted: ${v1.stock_deducted} (Expected: false)`);
    console.log(`MoMo  order status: ${v2.status} (Expected: cancelled)`);
    console.log(`MoMo  order payment_status: ${v2.payment_status} (Expected: failed)`);
    console.log(`MoMo  order stock_deducted: ${v2.stock_deducted} (Expected: false)`);

    const finalVariant = await ProductVariant.findById(variant._id);
    const finalProduct = await Product.findById(product._id);
    console.log(`Variant stock after restore: ${finalVariant.stock} (Expected: 20)`);
    console.log(`Product sold after restore: ${finalProduct.sold} (Expected: 0)`);

    const allPassed =
      v1.status === "cancelled" && v1.payment_status === "failed" && v1.stock_deducted === false &&
      v2.status === "cancelled" && v2.payment_status === "failed" && v2.stock_deducted === false &&
      finalVariant.stock === 20 && finalProduct.sold === 0;

    if (allPassed) {
      console.log("\n✅ SUCCESS: All Reservation Timeout test cases Passed!");
    } else {
      console.log("\n❌ FAIL: Some test cases Failed!");
    }
  } finally {
    // 5. Clean up
    console.log("\n--- Cleaning Up ---");
    await OrderItem.deleteMany({ order_id: { $in: [orderVnpay._id, orderMomo._id] } });
    await Order.deleteMany({ _id: { $in: [orderVnpay._id, orderMomo._id] } });
    await ProductVariant.deleteOne({ _id: variant._id });
    await Product.deleteOne({ _id: product._id });
    console.log("Cleaned up successfully.");
  }

  await mongoose.disconnect();
}

test().catch(console.error);
