import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Define a temporary schema and model to test hooks
const testSchema = new mongoose.Schema({
  name: String,
  product_id: mongoose.Schema.Types.Mixed,
  rating: Number,
});

testSchema.statics.updateProductRating = async function(productId) {
  console.log('>> statics.updateProductRating called with productId:', productId);
};

testSchema.post('save', async function(doc) {
  console.log('>> post("save") hook triggered for doc:', doc.name);
  if (doc && doc.product_id) {
    await doc.constructor.updateProductRating(doc.product_id);
  }
});

testSchema.post('findOneAndUpdate', async function(doc) {
  console.log('>> post("findOneAndUpdate") hook triggered. doc exists:', !!doc);
  if (doc) {
    console.log('   doc name:', doc.name, 'product_id:', doc.product_id);
    await doc.constructor.updateProductRating(doc.product_id);
  }
});

testSchema.post('findOneAndDelete', async function(doc) {
  console.log('>> post("findOneAndDelete") hook triggered. doc exists:', !!doc);
  if (doc) {
    console.log('   doc name:', doc.name, 'product_id:', doc.product_id);
    await doc.constructor.updateProductRating(doc.product_id);
  }
});

const TestModel = mongoose.model('TestHookModel', testSchema);

async function run() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  await mongoose.connect(uri);

  // Clean up
  await TestModel.deleteMany({});

  console.log('\n--- 1. Testing save hook ---');
  const doc = new TestModel({ name: 'Review 1', product_id: 'prod123', rating: 5 });
  await doc.save();

  console.log('\n--- 2. Testing findOneAndUpdate hook ---');
  await TestModel.findOneAndUpdate(
    { name: 'Review 1' },
    { $set: { rating: 4 } },
    { new: true } // Return modified doc
  );

  console.log('\n--- 3. Testing findOneAndDelete hook ---');
  await TestModel.findOneAndDelete({ name: 'Review 1' });

  // Clean up again
  await TestModel.deleteMany({});
  await mongoose.disconnect();
}

run().catch(console.error);
