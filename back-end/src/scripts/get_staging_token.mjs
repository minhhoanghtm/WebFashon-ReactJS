import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Redis from 'ioredis';
import { requireEnv } from './require-env.js';

const uri = requireEnv('MONGO_CONNECTIONSTRING');
const JWT_SECRET = requireEnv('JWT_SECRET');

async function main() {
  await mongoose.connect(uri);
  const redis = new Redis({ host: '127.0.0.1', port: 6381 });

  const usersColl = mongoose.connection.db.collection('users');
  let user = await usersColl.findOne({ role: 'user' });

  const userId = user._id.toString();
  const jti = crypto.randomUUID();

  // Whitelist in Redis
  await redis.set(`at:${jti}`, userId, 'EX', 86400);

  const token = jwt.sign(
    { userId, role: user.role, email: user.email, jti },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  console.log('USER_ID:', userId);
  console.log('ACCESS_TOKEN:', token);
  console.log('USER_JSON:', JSON.stringify({
    _id: userId,
    id: userId,
    fullName: user.fullName || 'Khách Hàng Thân Thiết',
    email: user.email,
    role: user.role,
  }));

  await redis.quit();
  await mongoose.disconnect();
}
main().catch(console.error);
