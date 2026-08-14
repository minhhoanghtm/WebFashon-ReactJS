import productRepository from "../product.repository.js";
import { AppError } from "../../../common/exceptions/AppError.js";
import { createSlug } from "../../../common/utils/slug.js";
import { toNoAccent } from "../../../common/utils/removeAccents.js";
import mongoose from "mongoose";

export const updateProduct = async (id, productData) => {
  const { variants, ...productBody } = productData;

  let finalStock = Number(productBody.stock || 0);
  if (Array.isArray(variants) && variants.length > 0) {
    finalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
  }

  const updateFields = {
    ...productBody,
    stock: finalStock,
  };

  if (productBody.name) {
    updateFields.name_no_accents = toNoAccent(productBody.name);
    if (!productBody.slug) {
      updateFields.slug = createSlug(productBody.name);
    }
  }

  const updatedProduct = await productRepository.findByIdAndUpdate(id, updateFields);
  if (!updatedProduct) {
    throw new AppError("Sản phẩm không tồn tại", 404);
  }

  if (Array.isArray(variants)) {
    await productRepository.deleteVariantsByProductId(new mongoose.Types.ObjectId(id));

    const variantDocs = variants
      .filter((variant) => variant?.color && variant?.image_url)
      .map((variant) => ({
        product_id: new mongoose.Types.ObjectId(id),
        color: variant.color,
        size: variant.size,
        stock: Number(variant.stock || 0),
        image_url: variant.image_url,
      }));

    if (variantDocs.length > 0) {
      await productRepository.insertManyVariants(variantDocs);
    }
  }

  return updatedProduct;
};
