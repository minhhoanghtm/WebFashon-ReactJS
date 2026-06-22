import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import orderFacade from '../modules/orders/order.facade.js';
import { Product, ProductVariant } from '../modules/products/product.model.js';
import { Order, OrderItem } from '../modules/orders/order.model.js';

async function test() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  await mongoose.connect(uri);
  console.log("Connected to MongoDB successfully.");

  // 1. Seed test data
  console.log("\n--- Seeding Test Product & Variant ---");
  const testProduct = await Product.create({
    name: "Integration Test Product",
    slug: "integration-test-product-unique-" + Date.now(),
    category_id: new mongoose.Types.ObjectId(),
    old_price: 200000,
    new_price: 150000,
    stock: 10,
    sold: 0,
    is_active: true
  });

  const testVariant = await ProductVariant.create({
    product_id: testProduct._id,
    color: "Red",
    size: "M",
    stock: 10,
    image_url: "http://example.com/image-red.jpg"
  });
  console.log(`Created test product ${testProduct._id} & variant ${testVariant._id} with stock 10`);

  const mockUserId = new mongoose.Types.ObjectId();
  console.log("Created mockUserId:", mockUserId);
  const mockOrderData = {
    payment_method: "cod",
    shipping_address: {
      full_name: "John Doe",
      phone: "0912345678",
      city: "Hồ Chí Minh",
      district: "Quận 1",
      ward: "Bến Nghé",
      address_detail: "123 Lê Lợi"
    },
    items: [
      {
        product_id: testProduct._id.toString(),
        variant_id: testVariant._id.toString(),
        quantity: 3
      }
    ]
  };

  let order;
  try {
    // 2. Test Order Creation & Stock Deduction
    console.log("\n--- Test Case 1: Create Order & Deduct Stock ---");
    console.log("Calling createOrderWithoutTransaction with:", mockUserId, mockOrderData);
    // orderFacade delegates createOrderWithoutTransaction to createOrder's fallback or we can call createOrder directly
    // Wait, in order.facade.js we exported:
    // async createOrder(userId, orderData) { return await createOrder(userId, orderData); }
    // Let's add createOrderWithoutTransaction to order.facade.js if it was called directly!
    // Wait, createOrder itself automatically falls back to createOrderWithoutTransaction on error, but in the test it calls createOrderWithoutTransaction.
    // Let's check order.facade.js, we didn't add createOrderWithoutTransaction. Let's add it or call createOrder directly in the test.
    // Wait, in createOrder.command.js we exported createOrderWithoutTransaction, so we can expose it in orderFacade or import it.
    // Let's expose createOrderWithoutTransaction in orderFacade for completeness and compatibility!
    // First, let's update this test to use orderFacade.createOrder or orderFacade.createOrderWithoutTransaction if exposed.
    // Let's use orderFacade.createOrder since it will fall back anyway, or let's update order.facade.js to export createOrderWithoutTransaction.
    // Actually, let's expose it in order.facade.js, it's safer. Let's write the test to call orderFacade.createOrder first.
    order = await orderFacade.createOrder(mockUserId, mockOrderData);
    console.log(`Order created successfully: ${order._id}`);
    
    let updatedVariant = await ProductVariant.findById(testVariant._id);
    let updatedProduct = await Product.findById(testProduct._id);
    console.log(`Variant stock after order: ${updatedVariant.stock} (Expected: 7)`);
    console.log(`Product stock after order: ${updatedProduct.stock} (Expected: 7)`);
    console.log(`Product sold after order: ${updatedProduct.sold} (Expected: 3)`);
    console.log(`Order stock_deducted flag: ${order.stock_deducted} (Expected: true)`);

    if (updatedVariant.stock === 7 && updatedProduct.stock === 7 && updatedProduct.sold === 3 && order.stock_deducted === true) {
      console.log("✅ SUCCESS: Test Case 1 Passed!");
    } else {
      console.log("❌ FAIL: Test Case 1 Failed!");
    }

    // 3. Test Order Cancellation & Stock Restoration
    console.log("\n--- Test Case 2: Cancel Order & Restore Stock ---");
    await orderFacade.updateOrderStatus(order._id, "cancelled");
    
    updatedVariant = await ProductVariant.findById(testVariant._id);
    updatedProduct = await Product.findById(testProduct._id);
    let orderAfterCancel = await Order.findById(order._id);
    console.log(`Variant stock after cancel: ${updatedVariant.stock} (Expected: 10)`);
    console.log(`Product stock after cancel: ${updatedProduct.stock} (Expected: 10)`);
    console.log(`Product sold after cancel: ${updatedProduct.sold} (Expected: 0)`);
    console.log(`Order stock_deducted flag: ${orderAfterCancel.stock_deducted} (Expected: false)`);

    if (updatedVariant.stock === 10 && updatedProduct.stock === 10 && updatedProduct.sold === 0 && orderAfterCancel.stock_deducted === false) {
      console.log("✅ SUCCESS: Test Case 2 Passed!");
    } else {
      console.log("❌ FAIL: Test Case 2 Failed!");
    }

    // 4. Test Idempotency (Restore again should not change stock)
    console.log("\n--- Test Case 3: Double Restore (Idempotency Guard) ---");
    await orderFacade.restoreOrderStock(orderAfterCancel);
    
    updatedVariant = await ProductVariant.findById(testVariant._id);
    updatedProduct = await Product.findById(testProduct._id);
    console.log(`Variant stock after double restore: ${updatedVariant.stock} (Expected: 10)`);
    console.log(`Product stock after double restore: ${updatedProduct.stock} (Expected: 10)`);

    if (updatedVariant.stock === 10 && updatedProduct.stock === 10) {
      console.log("✅ SUCCESS: Test Case 3 Passed!");
    } else {
      console.log("❌ FAIL: Test Case 3 Failed!");
    }

    // 5. Test Order Deletion & Stock Restoration
    console.log("\n--- Test Case 4: Delete Order & Restore Stock ---");
    // Let's create a new order first
    const order2 = await orderFacade.createOrder(mockUserId, mockOrderData);
    console.log(`Created second order: ${order2._id}`);
    
    updatedVariant = await ProductVariant.findById(testVariant._id);
    console.log(`Variant stock before delete: ${updatedVariant.stock} (Expected: 7)`);
    
    await orderFacade.deleteOrder(order2._id);
    console.log("Deleted second order.");
    
    updatedVariant = await ProductVariant.findById(testVariant._id);
    updatedProduct = await Product.findById(testProduct._id);
    console.log(`Variant stock after delete: ${updatedVariant.stock} (Expected: 10)`);
    console.log(`Product stock after delete: ${updatedProduct.stock} (Expected: 10)`);

    if (updatedVariant.stock === 10 && updatedProduct.stock === 10) {
      console.log("✅ SUCCESS: Test Case 4 Passed!");
    } else {
      console.log("❌ FAIL: Test Case 4 Failed!");
    }

  } finally {
    // 6. Clean up
    console.log("\n--- Cleaning Up Test Data ---");
    if (order) {
      await OrderItem.deleteMany({ order_id: order._id });
      await Order.deleteOne({ _id: order._id });
    }
    await ProductVariant.deleteOne({ _id: testVariant._id });
    await Product.deleteOne({ _id: testProduct._id });
    console.log("Test data cleaned up successfully.");
  }

  await mongoose.disconnect();
}

test().catch(console.error);
