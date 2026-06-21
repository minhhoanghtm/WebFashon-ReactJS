import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import Order from '../modules/orders/order.model.js';

async function check() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  await mongoose.connect(uri);
  const orders = await Order.find().sort({ createdAt: -1 }).limit(10);
  console.log('Recent 10 Orders:');
  orders.forEach(o => {
    console.log(`ID: ${o._id}, Total: ${o.total_price}, Method: ${o.payment_method}, Status: ${o.status}, PaymentStatus: ${o.payment_status}, CreatedAt: ${o.createdAt}`);
  });
  await mongoose.disconnect();
}

check().catch(console.error);
