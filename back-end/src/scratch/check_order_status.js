import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import Product from '../modules/products/product.model.js';
import Order from '../modules/orders/order.model.js';
import PaymentTransaction from '../modules/payments/paymentTransaction.model.js';

async function check() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  await mongoose.connect(uri);

  const orderId = '6a3d658c363cacf6a8f2de18';
  const order = await Order.findById(orderId).lean();
  console.log('--- Order Data ---');
  if (order) {
    console.log(JSON.stringify(order, null, 2));
  } else {
    console.log('Order not found!');
  }

  console.log('\n--- Payment Transactions ---');
  const txns = await PaymentTransaction.find({ order_id: orderId }).lean();
  console.log(JSON.stringify(txns, null, 2));

  await mongoose.disconnect();
}

check().catch(console.error);
