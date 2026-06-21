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
  
  // Create a draft order (do not save to DB)
  const draftOrder = new Order({
    user_id: new mongoose.Types.ObjectId(),
    total_price: 100000,
    shipping_address: {
      full_name: "Test Customer",
      phone: "0912345678",
      city: "Hà Nội",
      district: "Hoàn Kiếm",
      ward: "Tràng Tiền",
      address_detail: "1 Tràng Tiền"
    }
  });

  console.log("=== Testing Order Schema ===");
  console.log("Draft Order stock_deducted:", draftOrder.stock_deducted);
  
  if (draftOrder.stock_deducted === false) {
    console.log("SUCCESS: Default stock_deducted is false");
  } else {
    console.log("FAIL: Default stock_deducted is not false");
  }

  await mongoose.disconnect();
}

check().catch(console.error);
