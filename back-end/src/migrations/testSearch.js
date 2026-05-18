import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { toNoAccent } from '../utils/removeAccents.js';
import dotenv from 'dotenv';

dotenv.config();

const testSearch = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTIONSTRING);
    console.log('✓ Kết nối database thành công\n');

    // Test tìm kiếm với các keyword khác nhau
    const searchKeywords = ['Ao', 'ao', 'Quan', 'giay'];

    for (const keyword of searchKeywords) {
      console.log(`\n🔍 Tìm kiếm: "${keyword}"`);
      console.log(`   → Chuyển đổi: "${toNoAccent(keyword)}"`);

      const query = {
        is_active: true,
        name_no_accents: {
          $regex: toNoAccent(keyword),
          $options: 'i'
        }
      };

      const results = await Product.find(query).select('name name_no_accents');
      
      if (results.length === 0) {
        console.log('   ❌ Không tìm thấy sản phẩm');
      } else {
        console.log(`   ✅ Tìm thấy ${results.length} sản phẩm:`);
        results.forEach(p => {
          console.log(`      - ${p.name} (${p.name_no_accents})`);
        });
      }
    }

    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
};

testSearch();
