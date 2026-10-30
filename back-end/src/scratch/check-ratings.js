import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import Product from '../modules/products/product.model.js';
import Review from '../modules/reviews/review.model.js';

async function checkRatings() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  console.log('Connecting to database at:', uri);
  await mongoose.connect(uri);

  const products = await Product.find({}).lean();
  const reviews = await Review.find({}).lean();

  console.log(`Found ${products.length} products and ${reviews.length} reviews.`);

  // Calculate actual ratings grouped by product_id
  const ratingMap = {};
  for (const review of reviews) {
    const pid = review.product_id ? review.product_id.toString() : '';
    if (!pid) continue;
    if (!ratingMap[pid]) {
      ratingMap[pid] = { sum: 0, count: 0 };
    }
    ratingMap[pid].sum += review.rating || 0;
    ratingMap[pid].count += 1;
  }

  console.log('\n--- Products and their ratings ---');
  for (const product of products) {
    const pid = product._id.toString();
    const actualData = ratingMap[pid];
    const actualAvg = actualData ? Number((actualData.sum / actualData.count).toFixed(1)) : 0;
    const dbRating = product.rating || 0;

    console.log(`Product: ${product.name}`);
    console.log(`  - DB rating: ${dbRating}`);
    console.log(`  - Calculated rating from reviews: ${actualAvg} (based on ${actualData ? actualData.count : 0} reviews)`);
    if (dbRating !== actualAvg) {
      console.log(`  ⚠️ MISMATCH! DB has ${dbRating} but calculated is ${actualAvg}`);
    } else {
      console.log(`  ✅ Match!`);
    }
  }

  await mongoose.disconnect();
}

checkRatings().catch(console.error);
