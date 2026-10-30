import productRepository from "../product.repository.js";
import { AppError } from "../../../common/exceptions/AppError.js";
import mongoose from "mongoose";
import { withTransaction } from "../../../common/transaction.helper.js";
import { triggerProductVectorRemove } from "../../ai/queues/vectorSync.queue.js";

export const deleteProduct = async (id) => {
  const deleted = await withTransaction(async (session) => {
    const deletedProduct = await productRepository.findByIdAndDelete(id, { session });
    if (!deletedProduct) {
      throw new AppError("Sản phẩm không tồn tại", 404);
    }
    // Ensure variants are removed within the same transaction
    await productRepository.deleteVariantsByProductId(new mongoose.Types.ObjectId(id), { session });
    return deletedProduct;
  });

  triggerProductVectorRemove(id).catch(() => {});

  return deleted;
};
