import mongoose from 'mongoose';
import { requireEnv } from './require-env.js';

const uri = requireEnv('MONGO_CONNECTIONSTRING');

async function main() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB staging');

  const productsColl = mongoose.connection.db.collection('products');
  let product = await productsColl.findOne({
    $or: [
      { name: { $regex: 'Đầm Maxi Hoa Nhí Đi Biển', $options: 'i' } },
      { slug: 'dam-maxi-hoa-nhi-di-bien' }
    ]
  });

  if (product) {
    console.log('Found existing product:', product._id, product.name, product.new_price);
  } else {
    console.log('Product not found, creating Đầm Maxi Hoa Nhí Đi Biển...');
    const newDoc = {
      name: 'Đầm Maxi Hoa Nhí Đi Biển',
      slug: 'dam-maxi-hoa-nhi-di-bien',
      category: 'Thời Trang Nữ',
      gender: 'women',
      old_price: 450000,
      new_price: 350000,
      stock: 50,
      description: 'Đầm Maxi Hoa Nhí Đi Biển thiết kế dáng dài thướt tha, chất liệu voan tơ mềm mại, họa tiết hoa nhí vintage trang nhã phù hợp đi du lịch, dạo phố, chụp ảnh check-in.',
      images: [
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80'
      ],
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80',
      variants: [
        {
          sku: 'DAM-MAXI-YEL-M',
          color: 'Hoa Nhí Vàng',
          size: 'M',
          price: 350000,
          stock: 25,
          image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80'
        },
        {
          sku: 'DAM-MAXI-BLU-L',
          color: 'Hoa Nhí Xanh',
          size: 'L',
          price: 350000,
          stock: 25,
          image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80'
        }
      ],
      tags: ['dam', 'maxi', 'hoa nhi', 'di bien', 'thoi trang nu'],
      rating: 4.8,
      numReviews: 12,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const res = await productsColl.insertOne(newDoc);
    console.log('Created product with id:', res.insertedId);
    product = await productsColl.findOne({ _id: res.insertedId });
  }

  // Also check if vector embedding exists or generate it
  if (!product.embedding || !Array.isArray(product.embedding) || product.embedding.length === 0) {
    console.log('Generating fallback 1536-dim normalized embedding for product vector search...');
    // Create a 1536 unit vector with deterministic pseudo-random values based on slug
    const dim = 1536;
    let seed = 42;
    for (let i = 0; i < product.name.length; i++) seed = (seed * 31 + product.name.charCodeAt(i)) % 100000;
    const emb = new Array(dim);
    let norm = 0;
    for (let i = 0; i < dim; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      emb[i] = (seed / 233280.0) - 0.5;
      norm += emb[i] * emb[i];
    }
    norm = Math.sqrt(norm);
    for (let i = 0; i < dim; i++) emb[i] = emb[i] / norm;

    await productsColl.updateOne(
      { _id: product._id },
      { $set: { embedding: emb } }
    );
    console.log('Updated product embedding.');
  }

  console.log('Product ready:', {
    id: product._id.toString(),
    name: product.name,
    price: product.new_price,
    variants: product.variants
  });

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
