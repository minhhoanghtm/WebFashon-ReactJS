import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Load models
import { Order, OrderItem } from '../modules/orders/order.model.js';
import Product from '../modules/products/product.model.js';

async function check() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  await mongoose.connect(uri);

  const totalProducts = await Product.countDocuments({});
  
  // Sum variant stocks
  const variants = await mongoose.model("product_variants").find({});
  let totalStock = 0;
  variants.forEach(v => {
    totalStock += v.stock || 0;
  });

  console.log('--- Database Product Counts ---');
  console.log('Total Product Models in DB:', totalProducts);
  console.log('Total Stock across all variants:', totalStock);

  await mongoose.disconnect();
}

check().catch(console.error);
