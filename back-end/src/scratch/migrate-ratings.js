import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import Product from '../modules/products/product.model.js';
import Review from '../modules/reviews/review.model.js';

async function migrateRatings() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  console.log('Connecting to database at:', uri);
  await mongoose.connect(uri);

  const products = await Product.find({});
  console.log(`Processing ${products.length} products...`);

  for (const product of products) {
    const productId = product._id;
    
    // Find all reviews matching this product_id
    const reviews = await Review.find({
      $or: [
        { product_id: mongoose.Types.ObjectId.isValid(productId) ? new mongoose.Types.ObjectId(productId) : productId },
        { product_id: productId.toString() }
      ]
    });

    let averageRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
      averageRating = Number((sum / reviews.length).toFixed(1));
    }

    if (product.rating !== averageRating) {
      console.log(`Updating product "${product.name}" (${productId}): rating ${product.rating || 0} -> ${averageRating}`);
      product.rating = averageRating;
      await product.save();
    } else {
      console.log(`Product "${product.name}" (${productId}) rating is already correct: ${averageRating}`);
    }
  }

  // Clear product list cache so UI shows new ratings
  try {
    const { getRedisConnection } = await import("../configs/redis.js");
    const redis = getRedisConnection();
    const keys = await redis.keys("products:*");
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Cleared ${keys.length} cached product keys from Redis.`);
    }
  } catch (cacheErr) {
    console.log('Redis cache clean skipped or errored:', cacheErr.message);
  }

  console.log('Migration completed successfully!');
  await mongoose.disconnect();
}

migrateRatings().catch(console.error);
