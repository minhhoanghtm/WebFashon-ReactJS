// src/modules/products/product.cache.service.js
import { getRedisConnection } from '../../configs/redis.js';
import logger from '../../common/logger.js';
import crypto from 'crypto';
import Product from './product.model.js';

const LIST_TTL = 60 * 5;      // 5 minutes
const DETAIL_TTL = 60 * 10;   // 10 minutes
const CATEGORY_TTL = 60 * 5;  // 5 minutes

function hashQuery(obj) {
  return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex');
}

/** Get paginated product list with optional filters */
export async function getProductList({ page = 1, limit = 20, filter = {} }) {
  const redis = getRedisConnection();
  const key = `product:list:${page}:${limit}:${hashQuery(filter)}`;
  const cached = await redis.get(key);
  if (cached) {
    logger.info('Cache hit %s', key);
    return JSON.parse(cached);
  }
  const [products, total] = await Promise.all([
    Product.find(filter).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  const payload = { products, total, page, limit };
  await redis.set(key, JSON.stringify(payload), 'EX', LIST_TTL);
  logger.info('Cache miss – saved %s', key);
  return payload;
}

/** Get full product detail */
export async function getProductDetail(productId) {
  const redis = getRedisConnection();
  const key = `product:detail:${productId}`;
  const cached = await redis.get(key);
  if (cached) {
    logger.info('Cache hit %s', key);
    return JSON.parse(cached);
  }
  const product = await Product.findById(productId).lean();
  if (!product) return null;
  await redis.set(key, JSON.stringify(product), 'EX', DETAIL_TTL);
  return product;
}

/** Get products by category (paged) */
export async function getProductsByCategory(categoryId, page = 1, limit = 20) {
  const redis = getRedisConnection();
  const key = `product:category:${categoryId}:${page}:${limit}`;
  const cached = await redis.get(key);
  if (cached) {
    logger.info('Cache hit %s', key);
    return JSON.parse(cached);
  }
  const filter = { category_id: categoryId, is_active: true };
  const [products, total] = await Promise.all([
    Product.find(filter).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  const payload = { products, total, page, limit };
  await redis.set(key, JSON.stringify(payload), 'EX', CATEGORY_TTL);
  return payload;
}

/** Invalidate related cache entries when a product changes */
export async function invalidateProductCache({ productId, categoryId }) {
  const redis = getRedisConnection();
  const patterns = [
    `product:detail:${productId}`,
    `product:category:${categoryId}:*`,
    `product:list:*`
  ];
  for (const pat of patterns) {
    const stream = redis.scanStream({ match: pat });
    for await (const keys of stream) {
      if (keys.length) await redis.del(...keys);
    }
  }
  logger.info('Invalidated product cache for %s / %s', productId, categoryId);
}
