import mongoose from 'mongoose';
import { requireEnv } from './require-env.js';
const uri = requireEnv('MONGO_CONNECTIONSTRING');
async function main() {
  await mongoose.connect(uri);
  const r = await mongoose.connection.db.collection('products').updateOne(
    { slug: 'dam-maxi-hoa-nhi-di-bien' },
    { $set: { is_active: true, isAvailable: true } }
  );
  console.log('Updated is_active on maxi product:', r.modifiedCount);

  const p = await mongoose.connection.db.collection('products').findOne({ slug: 'dam-maxi-hoa-nhi-di-bien' });
  console.log('Maxi product now:', { id: p._id, name: p.name, is_active: p.is_active, price: p.new_price });

  await mongoose.disconnect();
}
main().catch(console.error);
