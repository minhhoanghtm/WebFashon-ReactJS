import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkRaw() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected!');

  const db = mongoose.connection.db;
  const rawLookbooks = await db.collection('pages').find({ type: 'lookbook' }).toArray();
  
  console.log(`Found ${rawLookbooks.length} raw lookbooks in 'pages' collection:`);
  for (const lb of rawLookbooks) {
    console.log(JSON.stringify(lb, null, 2));
    
    // Also fetch sections
    const sections = await db.collection('page_sections').find({ pageId: lb._id }).toArray();
    console.log(`Sections for ${lb.title}:`);
    console.log(JSON.stringify(sections, null, 2));
  }

  await mongoose.disconnect();
}

checkRaw().catch(console.error);
