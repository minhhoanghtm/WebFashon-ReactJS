import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { toNoAccent } from '../utils/removeAccents.js';
import dotenv from 'dotenv';

dotenv.config();

const updateProductNameNoAccents = async () => {
  try {
    // Kết nối database
    await mongoose.connect(process.env.MONGO_CONNECTIONSTRING);
    console.log('✓ Kết nối database thành công');

    // Tìm tất cả sản phẩm không có name_no_accents
    const productsToUpdate = await Product.find({
      $or: [
        { name_no_accents: null },
        { name_no_accents: undefined },
        { name_no_accents: '' }
      ]
    });

    console.log(`📦 Tìm thấy ${productsToUpdate.length} sản phẩm cần cập nhật`);

    if (productsToUpdate.length === 0) {
      console.log('✓ Tất cả sản phẩm đã có name_no_accents');
      await mongoose.connection.close();
      return;
    }

    // Cập nhật từng sản phẩm
    let updated = 0;
    for (const product of productsToUpdate) {
      const name_no_accents = toNoAccent(product.name);
      
      await Product.findByIdAndUpdate(product._id, {
        name_no_accents
      });
      
      updated++;
      console.log(`✓ [${updated}/${productsToUpdate.length}] ${product.name} → ${name_no_accents}`);
    }

    console.log(`\n✅ Cập nhật hoàn tất! ${updated} sản phẩm đã được cập nhật`);
    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật:', error);
    process.exit(1);
  }
};

updateProductNameNoAccents();
