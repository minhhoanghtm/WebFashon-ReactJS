/**
 * SCRIPT: fix-broken-product-images.js
 * Sửa các URL hình ảnh lỗi thời hoặc vi phạm CORS trong MongoDB:
 * - Thắt Lưng Da PU Nam Nữ (photo-1624222247344-550fb60fe8ff -> ảnh Unsplash hợp lệ)
 * - Áo thun basic (dosi-in.com -> Unsplash CDN)
 * - Áo thể thao (hoangphucphoto.com -> Unsplash CDN)
 *
 * Mặc định: DRY-RUN (chỉ đọc, in ra thay đổi dự kiến, không ghi vào DB).
 * Chạy thật: node src/scripts/fix-broken-product-images.js --apply
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isApply = process.argv.includes('--apply');
const uri = process.env.MONGO_CONNECTIONSTRING || process.env.MONGODB_URI;

const IMAGE_REPLACEMENTS = [
  {
    pattern: /photo-1624222247344-550fb60fe8ff/i,
    replacement: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    description: 'Thắt lưng da PU (ảnh Unsplash mới)',
  },
  {
    pattern: /dosi-in\.com/i,
    replacement: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    description: 'Áo thun basic (ảnh Unsplash mới)',
  },
  {
    pattern: /hoangphucphoto\.com/i,
    replacement: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80',
    description: 'Áo thể thao (ảnh Unsplash mới)',
  },
];

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return url;
  for (const item of IMAGE_REPLACEMENTS) {
    if (item.pattern.test(url)) {
      return item.replacement;
    }
  }
  return url;
}

async function run() {
  if (!uri) {
    console.error('❌ Không tìm thấy biến môi trường kết nối MongoDB.');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log(`MODE: ${isApply ? '🚀 APPLY (GHI VÀO DB)' : '🛡️ DRY-RUN (CHỈ KIỂM TRA, KHÔNG GHI)'}`);
  console.log('='.repeat(60));

  try {
    await mongoose.connect(uri);
    console.log('✅ Đã kết nối cơ sở dữ liệu MongoDB Atlas.');

    const collection = mongoose.connection.collection('products');
    const products = await collection.find({
      $or: [
        { displayProduct: { $regex: '550fb|hoangphuc|dosi-in' } },
        { image: { $regex: '550fb|hoangphuc|dosi-in' } },
        { 'variants.image_url': { $regex: '550fb|hoangphuc|dosi-in' } },
      ],
    }).toArray();

    console.log(`\nTìm thấy ${products.length} sản phẩm có chứa URL ảnh cần chuẩn hóa:\n`);

    let updatedCount = 0;

    for (const prod of products) {
      const updates = {};
      let hasChanges = false;

      if (Array.isArray(prod.displayProduct)) {
        const nextDisplay = prod.displayProduct.map((url) => {
          const sanitized = sanitizeUrl(url);
          if (sanitized !== url) hasChanges = true;
          return sanitized;
        });
        if (hasChanges) updates.displayProduct = nextDisplay;
      }

      if (prod.image) {
        const nextImage = sanitizeUrl(prod.image);
        if (nextImage !== prod.image) {
          updates.image = nextImage;
          hasChanges = true;
        }
      }

      if (Array.isArray(prod.variants)) {
        const nextVariants = prod.variants.map((v) => {
          if (v && v.image_url) {
            const sanitized = sanitizeUrl(v.image_url);
            if (sanitized !== v.image_url) hasChanges = true;
            return { ...v, image_url: sanitized };
          }
          return v;
        });
        if (hasChanges) updates.variants = nextVariants;
      }

      console.log(`📦 Sản phẩm: "${prod.name}" (ID: ${prod._id})`);
      if (updates.displayProduct) {
        console.log('   displayProduct cũ -> mới:');
        console.log('   [CŨ]:', prod.displayProduct);
        console.log('   [MỚI]:', updates.displayProduct);
      }

      if (isApply && hasChanges) {
        await collection.updateOne({ _id: prod._id }, { $set: updates });
        console.log('   -> ✅ ĐÃ CẬP NHẬT THÀNH CÔNG');
        updatedCount++;
      } else if (hasChanges) {
        console.log('   -> [DRY RUN] Sẽ cập nhật trường:', Object.keys(updates).join(', '));
        updatedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    if (isApply) {
      console.log(`🎉 Đã cập nhật xong ${updatedCount} sản phẩm vào cơ sở dữ liệu.`);
    } else {
      console.log(`🛡️ DRY-RUN hoàn tất: ${updatedCount} sản phẩm được phát hiện. Chưa có bản ghi nào bị thay đổi.`);
      console.log('Để thực thi ghi vào DB, hãy chạy: node back-end/src/scripts/fix-broken-product-images.js --apply');
    }
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Lỗi xử lý:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
