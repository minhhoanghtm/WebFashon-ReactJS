// Migration script: add weight field with default 0 to all existing products
// Run with: node scripts/migrate-add-weight-to-products.js

import { connectDB } from '../src/configs/db.js';
import { Product } from '../src/modules/products/product.model.js';

const runMigration = async () => {
  try {
    await connectDB();
    const result = await Product.updateMany({ weight: { $exists: false } }, { $set: { weight: 0 } });
    console.log(`✅ Migration completed. Matched ${result.matchedCount}, Modified ${result.modifiedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

runMigration();
