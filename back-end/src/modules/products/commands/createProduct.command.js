import productRepository from "../product.repository.js";
import { createSlug } from "../../../common/utils/slug.js";
import { toNoAccent } from "../../../common/utils/removeAccents.js";

export const addProduct = async (productData) => {
  const { name, variants = [], ...productBody } = productData;
  const slug = createSlug(name);
  const name_no_accents = toNoAccent(name);

  let finalStock = Number(productBody.stock || 0);
  if (Array.isArray(variants) && variants.length > 0) {
    finalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
  }

  const product = await productRepository.create({
    ...productBody,
    slug,
    name,
    name_no_accents,
    stock: finalStock,
  });

  if (Array.isArray(variants) && variants.length > 0) {
    const variantDocs = variants
      .filter((variant) => variant?.color && variant?.image_url)
      .map((variant) => ({
        product_id: product._id,
        color: variant.color,
        size: variant.size,
        stock: Number(variant.stock || 0),
        image_url: variant.image_url,
      }));

    if (variantDocs.length > 0) {
      await productRepository.insertManyVariants(variantDocs);
    }
  }

  return product;
};
