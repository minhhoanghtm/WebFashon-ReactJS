import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import orderFacade from '../modules/orders/order.facade.js';
import PaymentTransaction from '../modules/payments/paymentTransaction.model.js';
import Order from '../modules/orders/order.model.js';

async function forcePay() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  await mongoose.connect(uri);

  const orderId = '6a3d658c363cacf6a8f2de18';
  const order = await Order.findById(orderId);

  if (!order) {
    console.log('Order not found!');
    await mongoose.disconnect();
    return;
  }

  console.log('Current order status:', order.status, 'payment_status:', order.payment_status);

  // 1. Log PaymentTransaction
  const txnNo = 'VNPAY_FORCE_' + Date.now();
  await PaymentTransaction.create({
    order_id: orderId,
    provider: 'vnpay',
    transaction_id: txnNo,
    amount: order.total_price,
    status: 'success',
    raw_response: { note: 'Manual forced payment callback' }
  });
  console.log('Logged manual payment transaction:', txnNo);

  // 2. Call facade payment callback
  await orderFacade.paymentCallback(orderId, 'success', txnNo);
  console.log('Invoked orderFacade.paymentCallback.');

  // 3. Verify
  const updatedOrder = await Order.findById(orderId);
  console.log('Updated order status:', updatedOrder.status, 'payment_status:', updatedOrder.payment_status);

  await mongoose.disconnect();
}

forcePay().catch(console.error);
