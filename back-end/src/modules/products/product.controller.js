import productFacade from "./product.facade.js";
import validate from "../../middlewares/validateZod.js";
import { createProductSchema, updateProductSchema, searchProductSchema, createVariantSchema, updateVariantSchema } from "./productValidators.js";
import { successResponse } from "../../common/responses/index.js";
import logger from "../../common/logger.js";
import { getRedisConnection } from "../../configs/redis.js";

// Product controllers
export const addProduct = async (req, res, next) => {
  try {
    const product = await productFacade.addProduct(req.body);
    return successResponse(res, product, "Tạo sản phẩm thành công", 201);
  } catch (error) {
    next(error);
  }
};



export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await productFacade.getProductBySlug(slug);
    return successResponse(res, product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productFacade.updateProduct(id, req.body);
    return successResponse(res, product, "Cập nhật sản phẩm thành công");
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await productFacade.deleteProduct(id);
    return successResponse(res, data, "Xóa sản phẩm thành công");
  } catch (error) {
    next(error);
  }
};

export const getProductByCategory = async (req, res, next) => {
  try {
    const { categoryid } = req.params;
    const products = await productFacade.getProductByCategory(categoryid, req.query.limit);
    return successResponse(res, products);
  } catch (error) {
    next(error);
  }
};

export const getProductDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productFacade.getProductDetail(id);
    return successResponse(res, product);
  } catch (error) {
    next(error);
  }
};

export const suggestProducts = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    const products = await productFacade.suggestProducts(keyword);
    return successResponse(res, products);
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (req, res, next) => {
  try {
    const results = await productFacade.searchProducts(req.query);
    return successResponse(res, { products: results.products, pagination: results.pagination }, "Search successful");
  } catch (error) {
    next(error);
  }
};

export const getSlugByProductId = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const slug = await productFacade.getSlugByProductId(productId);
    return successResponse(res, { slug }, "Lấy slug thành công");
  } catch (error) {
    next(error);
  }
};

// Product Variant controllers
export const createProductVariant = async (req, res, next) => {
  try {
    const variant = await productFacade.createVariant(req.body);
    return successResponse(res, variant, "Thêm biến thể thành công", 201);
  } catch (error) {
    next(error);
  }
};

export const updateProductVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const variant = await productFacade.updateVariant(id, req.body);
    return successResponse(res, variant, "Cập nhật biến thể thành công");
  } catch (error) {
    next(error);
  }
};

export const deleteProductVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const variant = await productFacade.deleteVariant(id);
    return successResponse(res, variant, "Xóa biến thể sản phẩm thành công");
  } catch (error) {
    next(error);
  }
};

export const getProductVariantByProductId = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    const variants = await productFacade.getVariantsByProductId(product_id);
    return successResponse(res, variants);
  } catch (error) {
    next(error);
  }
};

export const getProductVariantById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const variant = await productFacade.getVariantById(id);
    return successResponse(res, variant);
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req, res, next) => {
  const redis = getRedisConnection();
  const CACHE_TTL = 600; // seconds
  const { sort = "createdAt", order = "desc" } = req.query;
  const CACHE_KEY = `products:all:sort:${sort}:order:${order}`;
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      logger.info('Cache hit for %s', CACHE_KEY);
      const products = JSON.parse(cached);
      return successResponse(res, products, 'From cache');
    }
    logger.info('Cache miss for %s – querying DB', CACHE_KEY);
    const products = await productFacade.getAllProducts(sort, order);
    await redis.set(CACHE_KEY, JSON.stringify(products), 'EX', CACHE_TTL);
    logger.info('Cache set for %s with TTL %ds', CACHE_KEY, CACHE_TTL);
    return successResponse(res, products);
  } catch (err) {
    logger.error('getProducts error: %s', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
export const getRandomProducts = async (req, res, next) => {
  const { limit = 10, page = 1, seed } = req.query;
  const numericLimit = parseInt(limit, 10);
  const numericPage = parseInt(page, 10);
  const skip = (numericPage - 1) * numericLimit;
  const redis = getRedisConnection();
  // Build cache key – if a seed is provided we can cache per seed to keep order stable for that seed
  const cacheKey = seed
    ? `products:random:${seed}:page:${numericPage}:limit:${numericLimit}`
    : null;
  try {
    if (cacheKey) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info('Cache hit for %s', cacheKey);
        return successResponse(res, JSON.parse(cached), 'From cache');
      }
    }

    // Aggregation pipeline: sample a larger set then paginate to keep randomness per page
    const pipeline = [
      { $sample: { size: numericLimit * numericPage } },
      { $skip: skip },
      { $limit: numericLimit }
    ];
    const products = await productFacade.aggregate(pipeline);

    if (cacheKey) {
      await redis.set(cacheKey, JSON.stringify(products), 'EX', 300); // 5 min
      logger.info('Cache set for %s', cacheKey);
    }

    return successResponse(res, products);
  } catch (err) {
    logger.error('getRandomProducts error: %s', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
