import productRepository from "../product.repository.js";
import { toNoAccent } from "../../../common/utils/removeAccents.js";
import { AppError } from "../../../common/exceptions/AppError.js";
import mongoose from "mongoose";

export const getAllProducts = async (limit = 20) => {
  const products = await productRepository.findRandomProducts({}, limit);
  if(!products || products.length === 0) {
    throw new AppError("Không tìm thấy sản phẩm nào", 404);
  }
  return products;
};

export const getProductDetail = async (id) => {
  const product = await productRepository.findByIdWithVariants(id);
  if (!product) {
    throw new AppError("Sản phẩm không tồn tại", 404);
  }
  return product;
};

export const getProductBySlug = async (slug) => {
  const product = await productRepository.findOne({ slug });
  if (!product) {
    throw new AppError("Sản phẩm không tồn tại", 404);
  }
  return product;
};

export const searchProducts = async (filterQuery) => {
  const {
    search = "",
    page = 1,
    limit = 10,
    category,
    minPrice,
    maxPrice,
    rating,
    sort = "default",
  } = filterQuery;

  const query = { is_active: true };

  if (search?.trim()) {
    const keyword = toNoAccent(search.trim());
    query.name_no_accents = { $regex: keyword, $options: "i" };
  }

  if (category) {
    query.category_id = { $in: category.split(",") };
  }

  if (minPrice || maxPrice) {
    query.new_price = {};
    if (minPrice) query.new_price.$gte = Number(minPrice);
    if (maxPrice) query.new_price.$lte = Number(maxPrice);
  }

  if (rating) {
    query.rating = { $gte: Number(rating) };
  }

  const currentPage = Math.max(Number(page), 1);
  const perPage = Math.max(Number(limit), 1);
  const skip = (currentPage - 1) * perPage;

  const sortOptions = {
    default: { createdAt: -1, _id: -1 },
    newest: { createdAt: -1, _id: -1 },
    popular: { sold: -1, rating: -1, _id: -1 },
    price_asc: { new_price: 1, _id: 1 },
    price_desc: { new_price: -1, _id: -1 },
    name_asc: { name: 1, _id: 1 },
  };
  const sortOption = sortOptions[sort] || sortOptions.default;

  const [products, total] = await Promise.all([
    productRepository.findPaginated(query, sortOption, skip, perPage),
    productRepository.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      total,
      page: currentPage,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
};

export const suggestProducts = async (keyword) => {
  if (!keyword) {
    throw new AppError("Vui lòng cung cấp từ khóa gợi ý", 400);
  }
  const key = toNoAccent(keyword.trim());
  return await productRepository.find(
    {
      is_active: true,
      name_no_accents: { $regex: key, $options: "i" },
    },
    { createdAt: -1 },
    0,
    10
  );
};

export const getProductByCategory = async (categoryId, limitOption = 6) => {
  const limit = Math.min(Number(limitOption) || 6, 12);
  return await productRepository.find({ category_id: categoryId }, { createdAt: -1 }, 0, limit);
};

export const getSlugByProductId = async (productId) => {
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new AppError("Sản phẩm không tồn tại", 404);
  }
  return product.slug;
};

export const getProductDetailForChat = async (id) => {
  const product = await getProductDetail(id);
  return {
    id: product._id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    new_price: product.new_price,
    old_price: product.old_price,
    rating: product.rating,
    sold: product.sold,
    variants: product.variants || [],
  };
};

// Variant logic (requested under product.query.js)
export const createVariant = async (variantData) => {
  return await productRepository.createVariant(variantData);
};

export const updateVariant = async (id, updateData) => {
  const updated = await productRepository.findVariantByIdAndUpdate(id, updateData);
  if (!updated) {
    throw new AppError("Không tìm thấy biến thể sản phẩm", 404);
  }
  return updated;
};

export const deleteVariant = async (id) => {
  const deleted = await productRepository.findVariantByIdAndDelete(id);
  if (!deleted) {
    throw new AppError("Không tìm thấy biến thể sản phẩm", 404);
  }
  return deleted;
};

export const getVariantsByProductId = async (productId) => {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError("product_id không hợp lệ", 400);
  }
  return await productRepository.findVariants({
    product_id: new mongoose.Types.ObjectId(productId),
  });
};

export const getVariantById = async (id) => {
  const variant = await productRepository.findVariantById(id);
  if (!variant) {
    throw new AppError("Không tìm thấy biến thể sản phẩm", 404);
  }
  return variant;
};
