import productRepository from "../product.repository.js";
import { AppError } from "../../../common/exceptions/AppError.js";
import mongoose from "mongoose";

export const deleteProduct = async (id) => {
  const deletedProduct = await productRepository.findByIdAndDelete(id);
  if (!deletedProduct) {
    throw new AppError("Sản phẩm không tồn tại", 404);
  }
  await productRepository.deleteVariantsByProductId(new mongoose.Types.ObjectId(id));
  return deletedProduct;
};
