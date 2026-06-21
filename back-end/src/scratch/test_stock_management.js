import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import productService from '../modules/products/product.service.js';
import { Product, ProductVariant } from '../modules/products/product.model.js';

async function test() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  await mongoose.connect(uri);
  console.log("Connected to MongoDB successfully.");

  // 1. Seed test data
  console.log("\n--- Seeding Test Data ---");
  const testProduct = await Product.create({
    name: "Test Stock Product",
    slug: "test-stock-product-unique-" + Date.now(),
    category_id: new mongoose.Types.ObjectId(),
    old_price: 200000,
    new_price: 150000,
    stock: 20, // Initial product stock
    sold: 5,   // Initial sold count
    is_active: true
  });
  console.log(`Created test product ${testProduct._id} with stock: 20, sold: 5`);

  const testVariant = await ProductVariant.create({
    product_id: testProduct._id,
    color: "Blue",
    size: "XL",
    stock: 10, // Initial variant stock
    image_url: "http://example.com/image.jpg"
  });
  console.log(`Created test variant ${testVariant._id} with stock: 10`);

  // Update Product's stock to reflect variant sum
  testProduct.stock = 10;
  await testProduct.save();

  try {
    // 2. Test case 1: Deduct variant stock successfully
    console.log("\n--- Test Case 1: Deduct variant stock (Quantity = 3) ---");
    await productService.deductStock([
      {
        product_id: testProduct._id,
        variant_id: testVariant._id,
        quantity: 3
      }
    ]);

    const updatedVariant = await ProductVariant.findById(testVariant._id);
    const updatedProduct = await Product.findById(testProduct._id);
    console.log(`Variant stock after deduct: ${updatedVariant.stock} (Expected: 7)`);
    console.log(`Product stock after deduct: ${updatedProduct.stock} (Expected: 7)`);
    console.log(`Product sold after deduct: ${updatedProduct.sold} (Expected: 8)`);

    if (updatedVariant.stock === 7 && updatedProduct.stock === 7 && updatedProduct.sold === 8) {
      console.log("✅ SUCCESS: Test Case 1 Passed!");
    } else {
      console.log("❌ FAIL: Test Case 1 Failed!");
    }

    // 3. Test case 2: Deduct variant stock insufficient stock
    console.log("\n--- Test Case 2: Deduct variant stock insufficient (Quantity = 10) ---");
    try {
      await productService.deductStock([
        {
          product_id: testProduct._id,
          variant_id: testVariant._id,
          quantity: 10
        }
      ]);
      console.log("❌ FAIL: Expected error for insufficient variant stock, but succeeded!");
    } catch (error) {
      console.log("✅ SUCCESS: Error caught as expected:", error.message);
    }

    // 4. Test case 3: Restore variant stock
    console.log("\n--- Test Case 3: Restore variant stock (Quantity = 3) ---");
    await productService.restoreStock([
      {
        product_id: testProduct._id,
        variant_id: testVariant._id,
        quantity: 3
      }
    ]);

    const restoredVariant = await ProductVariant.findById(testVariant._id);
    const restoredProduct = await Product.findById(testProduct._id);
    console.log(`Variant stock after restore: ${restoredVariant.stock} (Expected: 10)`);
    console.log(`Product stock after restore: ${restoredProduct.stock} (Expected: 10)`);
    console.log(`Product sold after restore: ${restoredProduct.sold} (Expected: 5)`);

    if (restoredVariant.stock === 10 && restoredProduct.stock === 10 && restoredProduct.sold === 5) {
      console.log("✅ SUCCESS: Test Case 3 Passed!");
    } else {
      console.log("❌ FAIL: Test Case 3 Failed!");
    }

    // 5. Test case 4: Deduct product stock (no variant) successfully
    console.log("\n--- Test Case 4: Deduct product stock (no variant) (Quantity = 5) ---");
    await productService.deductStock([
      {
        product_id: testProduct._id,
        quantity: 5
      }
    ]);

    const updatedProductNoVar = await Product.findById(testProduct._id);
    console.log(`Product stock after deduct: ${updatedProductNoVar.stock} (Expected: 5)`);
    console.log(`Product sold after deduct: ${updatedProductNoVar.sold} (Expected: 10)`);

    if (updatedProductNoVar.stock === 5 && updatedProductNoVar.sold === 10) {
      console.log("✅ SUCCESS: Test Case 4 Passed!");
    } else {
      console.log("❌ FAIL: Test Case 4 Failed!");
    }

    // 6. Test case 5: Deduct product stock insufficient
    console.log("\n--- Test Case 5: Deduct product stock insufficient (Quantity = 10) ---");
    try {
      await productService.deductStock([
        {
          product_id: testProduct._id,
          quantity: 10
        }
      ]);
      console.log("❌ FAIL: Expected error for insufficient product stock, but succeeded!");
    } catch (error) {
      console.log("✅ SUCCESS: Error caught as expected:", error.message);
    }

    // 7. Test case 6: Restore product stock
    console.log("\n--- Test Case 6: Restore product stock (Quantity = 5) ---");
    await productService.restoreStock([
      {
        product_id: testProduct._id,
        quantity: 5
      }
    ]);

    const restoredProductNoVar = await Product.findById(testProduct._id);
    console.log(`Product stock after restore: ${restoredProductNoVar.stock} (Expected: 10)`);
    console.log(`Product sold after restore: ${restoredProductNoVar.sold} (Expected: 5)`);

    if (restoredProductNoVar.stock === 10 && restoredProductNoVar.sold === 5) {
      console.log("✅ SUCCESS: Test Case 6 Passed!");
    } else {
      console.log("❌ FAIL: Test Case 6 Failed!");
    }

  } finally {
    // 8. Clean up
    console.log("\n--- Cleaning Up Test Data ---");
    await ProductVariant.deleteOne({ _id: testVariant._id });
    await Product.deleteOne({ _id: testProduct._id });
    console.log("Test data cleaned up successfully.");
  }

  await mongoose.disconnect();
}

test().catch(console.error);
