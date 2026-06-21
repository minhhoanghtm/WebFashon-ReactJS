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
  const order = await Order.findById('6a37c7e29fca1637b0ca8d51');
  if (!order) {
    console.log('Order not found!');
  } else {
    console.log('Order Data:', JSON.stringify(order, null, 2));
  }
  await mongoose.disconnect();
}

check().catch(console.error);
