import { Product, ProductVariant } from "../product.model.js";
import { AppError } from "../../../common/exceptions/AppError.js";

export const deductStock = async (items, session = null) => {
  for (const item of items) {
    const { product_id, variant_id, quantity } = item;
    const qty = Number(quantity);
    if (!product_id || qty <= 0) continue;

    if (variant_id) {
      // 1. Check if variant exists
      const variant = await ProductVariant.findOne({ _id: variant_id, product_id }).session(session);
      if (!variant) {
        throw new AppError("Biến thể sản phẩm không tồn tại hoặc đã bị xóa", 404);
      }

      // 2. Atomic update variant stock
      const result = await ProductVariant.updateOne(
        { _id: variant_id, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { session }
      );
      if (result.modifiedCount === 0) {
        throw new AppError(
          `Sản phẩm (Màu: ${variant.color}, Cỡ: ${variant.size || 'N/A'}) không đủ số lượng trong kho (Còn lại: ${variant.stock})`,
          400
        );
      }

      // 3. Synchronize parent Product total stock and sold count
      await Product.updateOne(
        { _id: product_id },
        { $inc: { stock: -qty, sold: qty } },
        { session }
      );
    } else {
      // 1. Check if product exists
      const product = await Product.findOne({ _id: product_id }).session(session);
      if (!product) {
        throw new AppError("Sản phẩm không tồn tại hoặc đã bị xóa", 404);
      }

      // 2. Atomic update product stock and sold count
      const result = await Product.updateOne(
        { _id: product_id, stock: { $gte: qty } },
        { $inc: { stock: -qty, sold: qty } },
        { session }
      );
      if (result.modifiedCount === 0) {
        throw new AppError(
          `Sản phẩm "${product.name}" không đủ số lượng trong kho (Còn lại: ${product.stock})`,
          400
        );
      }
    }
  }
};

export const restoreStock = async (items, session = null) => {
  for (const item of items) {
    const { product_id, variant_id, quantity } = item;
    const qty = Number(quantity);
    if (!product_id || qty <= 0) continue;

    if (variant_id) {
      // 1. Restore variant stock
      await ProductVariant.updateOne(
        { _id: variant_id },
        { $inc: { stock: qty } },
        { session }
      );

      // 2. Synchronize parent Product total stock and sold count
      await Product.updateOne(
        { _id: product_id },
        { $inc: { stock: qty, sold: -qty } },
        { session }
      );
    } else {
      // 1. Restore product stock and sold count
      await Product.updateOne(
        { _id: product_id },
        { $inc: { stock: qty, sold: -qty } },
        { session }
      );
    }
  }
};
