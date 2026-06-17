import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { getLookbookBySlug } from '../modules/pages/page.controller.js';

async function test() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  await mongoose.connect(uri);
  console.log('Connected!');

  const req = {
    params: { slug: 'phai-dep' }
  };
  const res = {
    status: function(code) {
      console.log('Status code:', code);
      return this;
    },
    json: function(data) {
      console.log('JSON Response:', JSON.stringify(data, null, 2));
      return this;
    }
  };
  const next = function(err) {
    console.error('Next called with error:', err);
  };

  await getLookbookBySlug(req, res, next);

  await mongoose.disconnect();
}

test().catch(console.error);
