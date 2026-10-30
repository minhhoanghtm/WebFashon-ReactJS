import productRepository from "../product.repository.js";
import { toNoAccent } from "../../../common/utils/removeAccents.js";
import { AppError } from "../../../common/exceptions/AppError.js";
import mongoose from "mongoose";
import pricingService from "../../campaigns/pricing.service.js";
import semanticSearchService, {
  parseNaturalLanguageQuery,
} from "../../ai/services/semanticSearch.service.js";
import { triggerProductVectorSync } from "../../ai/queues/vectorSync.queue.js";

export const getAllProducts = async (limit = 20) => {
  const products = await productRepository.findRandomProducts({}, limit);
  if (!products || products.length === 0) {
    throw new AppError("Không tìm thấy sản phẩm nào", 404);
  }
  return await pricingService.resolvePricesForProducts(products);
};

const enrichProductWithPricing = async (product) => {
  if (!product) return product;
  const resolved = await pricingService.resolvePrice(product);
  const prodObj = product.toObject ? product.toObject() : { ...product };
  return {
    ...prodObj,
    price: resolved.finalPrice,
    new_price: resolved.finalPrice,
    old_price: resolved.isSale
      ? resolved.originalPrice
      : prodObj.old_price ?? prodObj.oldPrice ?? 0,
    oldPrice: resolved.isSale
      ? resolved.originalPrice
      : prodObj.old_price ?? prodObj.oldPrice ?? 0,
    campaign: resolved.campaignId
      ? {
          id: resolved.campaignId,
          name: resolved.campaignName,
          type: resolved.type,
          remainingQuota: resolved.remainingQuota,
          discountPercentage: resolved.discountPercentage,
          isQuotaExhausted: resolved.isQuotaExhausted || false,
          isSale: resolved.isSale,
        }
      : null,
  };
};

export const getProductDetail = async (id) => {
  const product = await productRepository.findByIdWithVariants(id);
  if (!product) {
    throw new AppError("Sản phẩm không tồn tại", 404);
  }
  return await enrichProductWithPricing(product);
};

export const getProductBySlug = async (slug) => {
  const product = await productRepository.findOne({ slug });
  if (!product) {
    throw new AppError("Sản phẩm không tồn tại", 404);
  }
  return await enrichProductWithPricing(product);
};

export const searchProducts = async (filterQuery) => {
  const {
    search = "",
    keyword = "",
    page = 1,
    limit = 10,
    category,
    minPrice,
    maxPrice,
    rating,
    sort = "default",
    semantic,
  } = filterQuery;

  const rawSearchTerm = (search || keyword).trim();
  const parsedNL = rawSearchTerm ? parseNaturalLanguageQuery(rawSearchTerm) : null;
  const effectiveMinPrice =
    minPrice !== undefined && minPrice !== ""
      ? Number(minPrice)
      : parsedNL?.extractedFilters?.minPrice ?? undefined;
  const effectiveMaxPrice =
    maxPrice !== undefined && maxPrice !== ""
      ? Number(maxPrice)
      : parsedNL?.extractedFilters?.maxPrice ?? undefined;

  const query = { is_active: true };
  const searchTermForRegex = parsedNL?.semanticQuery || rawSearchTerm;

  if (searchTermForRegex) {
    const cleanSearch = toNoAccent(searchTermForRegex);
    const words = cleanSearch.split(/\s+/).filter(Boolean);

    if (words.length > 0) {
      query.$and = words.map((w) => {
        const escapedWord = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return {
          $or: [
            { name_no_accents: { $regex: escapedWord, $options: "i" } },
            { name: { $regex: escapedWord, $options: "i" } },
            { description: { $regex: escapedWord, $options: "i" } },
          ],
        };
      });
    }
  }

  if (category) {
    query.category_id = { $in: category.split(",") };
  }

  if (effectiveMinPrice !== undefined || effectiveMaxPrice !== undefined) {
    query.new_price = {};
    if (effectiveMinPrice !== undefined) query.new_price.$gte = Number(effectiveMinPrice);
    if (effectiveMaxPrice !== undefined) query.new_price.$lte = Number(effectiveMaxPrice);
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

  let [products, total] = await Promise.all([
    productRepository.findPaginated(query, sortOption, skip, perPage),
    productRepository.countDocuments(query),
  ]);

  let searchMode = "keyword";
  const useSemantic =
    rawSearchTerm &&
    (semantic === "true" ||
      semantic === true ||
      total === 0 ||
      (total < 3 && rawSearchTerm.split(/\s+/).length >= 2));

  if (useSemantic) {
    try {
      const semRes = await semanticSearchService.search({
        query: rawSearchTerm,
        sourceType: "product",
        categoryId: category,
        minPrice: effectiveMinPrice,
        maxPrice: effectiveMaxPrice,
        minRating: rating ? Number(rating) : undefined,
        topK: Math.min(perPage, 30),
      });

      const matchedIds = (semRes.results || [])
        .map((r) => r.sourceId)
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (matchedIds.length > 0) {
        const existingIdSet = new Set(products.map((p) => String(p._id)));
        const additionalIds = matchedIds.filter((id) => !existingIdSet.has(String(id)));

        if (semantic === "true" || semantic === true || products.length === 0) {
          // Order by semantic similarity score
          const semDocs = await productRepository.findPaginated(
            { _id: { $in: matchedIds }, is_active: true },
            sortOption,
            0,
            matchedIds.length
          );
          const docMap = new Map(semDocs.map((d) => [String(d._id), d]));
          const scoreMap = new Map(semRes.results.map((r) => [String(r.sourceId), r.score]));
          const ordered = matchedIds
            .map((id) => {
              const doc = docMap.get(String(id));
              if (!doc) return null;
              const obj = doc.toObject ? doc.toObject() : { ...doc };
              obj.semanticScore = scoreMap.get(String(id)) || 0;
              return obj;
            })
            .filter(Boolean);

          if (ordered.length > 0) {
            products = ordered;
            total = ordered.length;
            searchMode = "semantic_hybrid";
          }
        } else if (additionalIds.length > 0) {
          const extraDocs = await productRepository.findPaginated(
            { _id: { $in: additionalIds }, is_active: true },
            sortOption,
            0,
            additionalIds.length
          );
          products = [...products, ...extraDocs];
          total = products.length;
          searchMode = "semantic_hybrid";
        }
      }
    } catch {
      // Keep keyword results if semantic enrichment fails
    }
  }

  return {
    products: await pricingService.resolvePricesForProducts(products),
    searchMode,
    appliedFilters: {
      minPrice: effectiveMinPrice,
      maxPrice: effectiveMaxPrice,
    },
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
  const rawKey = keyword.trim();
  const cleanKey = toNoAccent(rawKey);
  const words = cleanKey.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const query = {
    is_active: true,
    $and: words.map((w) => {
      const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return {
        $or: [
          { name_no_accents: { $regex: escaped, $options: "i" } },
          { name: { $regex: escaped, $options: "i" } },
        ],
      };
    }),
  };

  let foundProducts = await productRepository.find(query, { createdAt: -1 }, 0, 10);

  // Supplement with semantic suggestions when regex finds fewer than 5 results
  if (foundProducts.length < 5 && rawKey.length >= 3) {
    try {
      const semRes = await semanticSearchService.search({
        query: rawKey,
        sourceType: "product",
        topK: 7,
      });
      const existingIds = new Set(foundProducts.map((p) => String(p._id)));
      const extraIds = (semRes.results || [])
        .map((r) => r.sourceId)
        .filter((id) => mongoose.Types.ObjectId.isValid(id) && !existingIds.has(String(id)));

      if (extraIds.length > 0) {
        const extraProducts = await productRepository.find(
          { _id: { $in: extraIds }, is_active: true },
          { createdAt: -1 },
          0,
          7 - foundProducts.length
        );
        foundProducts = [...foundProducts, ...extraProducts];
      }
    } catch {
      // Ignore semantic suggestion error and return regex matches
    }
  }

  return await pricingService.resolvePricesForProducts(foundProducts);
};

export const getProductByCategory = async (categoryId, limitOption = 6) => {
  const limit = Math.min(Number(limitOption) || 6, 12);
  const foundProducts = await productRepository.find(
    { category_id: categoryId },
    { createdAt: -1 },
    0,
    limit
  );
  return await pricingService.resolvePricesForProducts(foundProducts);
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
  const created = await productRepository.createVariant(variantData);
  if (created?.product_id) {
    triggerProductVectorSync(created.product_id).catch(() => {});
  }
  return created;
};

export const updateVariant = async (id, updateData) => {
  const updated = await productRepository.findVariantByIdAndUpdate(id, updateData);
  if (!updated) {
    throw new AppError("Không tìm thấy biến thể sản phẩm", 404);
  }
  if (updated?.product_id) {
    triggerProductVectorSync(updated.product_id).catch(() => {});
  }
  return updated;
};

export const deleteVariant = async (id) => {
  const deleted = await productRepository.findVariantByIdAndDelete(id);
  if (!deleted) {
    throw new AppError("Không tìm thấy biến thể sản phẩm", 404);
  }
  if (deleted?.product_id) {
    triggerProductVectorSync(deleted.product_id).catch(() => {});
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
