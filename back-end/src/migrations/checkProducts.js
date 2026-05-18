import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const checkProductsInDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTIONSTRING);
    console.log('✓ Kết nối database thành công\n');

    // Lấy 5 sản phẩm đầu tiên
    const products = await Product.find().limit(5);

    console.log(`📦 Kiểm tra ${products.length} sản phẩm đầu tiên:\n`);

    products.forEach((product, idx) => {
      console.log(`[${idx + 1}] ${product.name}`);
      console.log(`    name_no_accents: ${product.name_no_accents || '❌ KHÔNG CÓ'}`);
      console.log(`    is_active: ${product.is_active}`);
      console.log('');
    });

    // Đếm sản phẩm có name_no_accents
    const withNameNoAccents = await Product.countDocuments({ 
      name_no_accents: { $exists: true, $ne: '' } 
    });
    const totalProducts = await Product.countDocuments();

    console.log(`📊 Thống kê:`);
    console.log(`   - Tổng sản phẩm: ${totalProducts}`);
    console.log(`   - Có name_no_accents: ${withNameNoAccents}`);
    console.log(`   - Thiếu name_no_accents: ${totalProducts - withNameNoAccents}`);

    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
};

checkProductsInDB();
