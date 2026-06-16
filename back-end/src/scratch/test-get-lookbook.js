import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import pageService from '../modules/pages/page.service.js';

async function test() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  await mongoose.connect(uri);
  console.log('Connected!');

  try {
    const slug = 'phai-dep';
    console.log(`Getting page by slug: ${slug}`);
    const page = await pageService.getPageBySlug(slug);
    console.log('Success page structure:', {
      _id: page._id,
      title: page.title,
      slug: page.slug,
      type: page.type,
      status: page.status,
      sectionsCount: page.sections ? page.sections.length : 0,
      sections: page.sections
    });
  } catch (err) {
    console.error('Error:', err);
  }

  await mongoose.disconnect();
}

test().catch(console.error);
