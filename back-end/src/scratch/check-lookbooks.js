import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import Page from '../modules/pages/page.model.js';
import PageSection from '../modules/pageSections/pageSection.model.js';

async function check() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected!');

  const lookbooks = await Page.find({ type: 'lookbook' }).lean();
  console.log(`Found ${lookbooks.length} lookbooks:`);
  for (const lb of lookbooks) {
    const sections = await PageSection.find({ pageId: lb._id }).lean();
    console.log(`- Title: "${lb.title}", Slug: "${lb.slug}", Status: "${lb.status}", Sections count: ${sections.length}`);
    console.log('  Sections:', sections.map(s => ({ type: s.type, order: s.order })));
  }

  await mongoose.disconnect();
}

check().catch(console.error);
