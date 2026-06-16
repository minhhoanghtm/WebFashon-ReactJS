import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import pageService from '../modules/pages/page.service.js';
import { LOOKBOOK_LIST_PROJECTION } from '../configs/constants.js';

async function test() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected!');

  try {
    const filters = {
      type: "lookbook",
      status: "published",
      select: LOOKBOOK_LIST_PROJECTION,
    };
    console.log('Fetching lookbooks with filters:', filters);
    const result = await pageService.getPages(filters);
    console.log('Result count:', result.pages.length);
    console.log('Lookbooks returned:');
    console.log(JSON.stringify(result.pages, null, 2));
  } catch (err) {
    console.error('Error during fetch:', err);
  }

  await mongoose.disconnect();
}

test().catch(console.error);
