import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { requireEnv } from './require-env.js';

const STAGING_URI = requireEnv('MONGO_CONNECTIONSTRING');
const adminPassword = requireEnv('STAGING_ADMIN_PASSWORD');

async function run() {
  await mongoose.connect(STAGING_URI);
  const admin = await mongoose.connection.db.collection('users').findOne({ email: 'admin@404studio.vn' });
  console.log('Admin user:', admin ? { email: admin.email, role: admin.role, status: admin.status } : null);
  if (admin) {
    const isMatch = await bcrypt.compare(adminPassword, admin.passWord);
    console.log('Admin password match:', isMatch);
    if (!isMatch) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await mongoose.connection.db.collection('users').updateOne(
        { _id: admin._id },
        { $set: { passWord: hash, status: 'active', role: 'admin' } }
      );
      console.log('Updated admin password from STAGING_ADMIN_PASSWORD.');
    }
  }
  await mongoose.disconnect();
}

run().catch(console.error);
