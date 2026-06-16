import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import Banner from '../modules/banners/banner.model.js';

async function update() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  await mongoose.connect(uri);
  console.log('Connected!');

  const res = await Banner.updateOne(
    { _id: '6a3155cba2a86a7ac2157a96' },
    { 
      targetType: 'lookbook',
      targetId: 'phai-dep'
    }
  );
  console.log('Update result:', res);

  await mongoose.disconnect();
}

update().catch(console.error);
