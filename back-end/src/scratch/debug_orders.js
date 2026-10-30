import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function check() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  await mongoose.connect(uri);
  
  const db = mongoose.connection.db;
  console.log('--- Printing all cart_items ---');
  const cartItems = await db.collection('cart_items').find({}).toArray();
  console.log(JSON.stringify(cartItems, null, 2));

  await mongoose.disconnect();
}

check().catch(console.error);
