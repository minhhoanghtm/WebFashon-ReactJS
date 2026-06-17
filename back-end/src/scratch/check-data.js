import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import PageSection from '../modules/pageSections/pageSection.model.js';

async function check() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  await mongoose.connect(uri);
  const sections = await PageSection.find({}).lean();
  console.log(JSON.stringify(sections, null, 2));
  await mongoose.disconnect();
}

check().catch(console.error);
