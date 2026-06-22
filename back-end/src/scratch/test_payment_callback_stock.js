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

  // Seed test product & variant
  console.log("\n--- Seeding Test Data ---");
  const testProduct = await Product.create({
    name: "Payment Test Product",
    slug: "payment-test-product-unique-" + Date.now(),
    category_id: new mongoose.Types.ObjectId(),
    old_price: 200000,
    new_price: 150000,
    stock: 10,
    sold: 0,
    is_active: true
  });

  const testVariant = await ProductVariant.create({
    product_id: testProduct._id,
    color: "Green",
    size: "S",
    stock: 10,
    image_url: "http://example.com/image-green.jpg"
  });

  const mockUserId = new mongoose.Types.ObjectId();
  const mockOrderData = {
    payment_method: "vnpay",
    shipping_address: {
      full_name: "Jane Smith",
      phone: "0912345678",
      city: "Đà Nẵng",
      district: "Hải Châu",
      ward: "Thạch Thang",
      address_detail: "456 Bạch Đằng"
    },
    items: [
      {
        product_id: testProduct._id.toString(),
        variant_id: testVariant._id.toString(),
        quantity: 2
      }
    ]
  };

  let order;
  try {
    // 1. Create order (stock is deducted: 10 -> 8)
    console.log("\n--- Step 1: Create Order ---");
    order = await orderFacade.createOrder(mockUserId, mockOrderData);
    console.log(`Order created: ${order._id}, stock_deducted: ${order.stock_deducted}`);
    
    let variant = await ProductVariant.findById(testVariant._id);
    console.log(`Stock after create: ${variant.stock} (Expected: 8)`);

    // 2. Simulate Payment Failure
    console.log("\n--- Step 2: Simulate Payment Failure (Expected: status=pending, payment_status=failed, stock reserved) ---");
    await orderFacade.paymentCallback(order._id, "failed", null);
    
    let updatedOrder = await Order.findById(order._id);
    console.log(`Order status: ${updatedOrder.status} (Expected: pending)`);
    console.log(`Order payment_status: ${updatedOrder.payment_status} (Expected: failed)`);
    
    variant = await ProductVariant.findById(testVariant._id);
    console.log(`Stock after payment failure: ${variant.stock} (Expected: 8)`);

    if (updatedOrder.status === "pending" && updatedOrder.payment_status === "failed" && variant.stock === 8) {
      console.log("✅ SUCCESS: Payment failure matches new design rules!");
    } else {
      console.log("❌ FAIL: Payment failure does not match!");
    }

    // 3. Simulate Order Timeout Cancellation (e.g. after 24h)
    console.log("\n--- Step 3: Simulate 24h Expiration Cancellation (Expected: status=cancelled, payment_status=failed, stock restored) ---");
    await orderFacade.cancelExpiredOrder(order._id);

    updatedOrder = await Order.findById(order._id);
    console.log(`Order status after cancel: ${updatedOrder.status} (Expected: cancelled)`);
    console.log(`Order payment_status after cancel: ${updatedOrder.payment_status} (Expected: failed)`);
    
    variant = await ProductVariant.findById(testVariant._id);
    console.log(`Stock after 24h cancel: ${variant.stock} (Expected: 10)`);

    if (updatedOrder.status === "cancelled" && updatedOrder.payment_status === "failed" && variant.stock === 10) {
      console.log("✅ SUCCESS: Expiration timeout cancellation works perfectly!");
    } else {
      console.log("❌ FAIL: Expiration timeout cancellation failed!");
    }

  } finally {
    // Clean up
    console.log("\n--- Cleaning Up ---");
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
