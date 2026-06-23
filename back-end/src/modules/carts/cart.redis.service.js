// src/modules/cart/cart.redis.service.js
import { getRedisConnection } from '../../configs/redis.js';
import logger from '../../common/logger.js';
import { v4 as uuidv4 } from 'uuid';

const USER_TTL = 60 * 60 * 24 * 30;   // 30 days
const GUEST_TTL = 60 * 60 * 24 * 7;   // 7 days


function userKey(userId) { return `cart:user:${userId}`; }
function guestKey(guestId) { return `cart:guest:${guestId}`; }

/** Retrieve cart (always returns an object with items array) */
export async function getCart({ userId, guestId }) {
  const redis = getRedisConnection();
  const key = userId ? userKey(userId) : guestKey(guestId);
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : { items: [] };
}

/** Save cart */
export async function saveCart({ userId, guestId, cart }) {
  const redis = getRedisConnection();
  const key = userId ? userKey(userId) : guestKey(guestId);
  const ttl = userId ? USER_TTL : GUEST_TTL;
  await redis.set(key, JSON.stringify(cart), 'EX', ttl);
}

/** Add or update an item */
export async function addItem({ userId, guestId, sku, quantity }) {
  const cart = await getCart({ userId, guestId });
  const item = cart.items.find(i => i.sku === sku);
  if (item) item.quantity += quantity;
  else cart.items.push({ sku, quantity });
  await saveCart({ userId, guestId, cart });
}

/** Merge guest cart into logged‑in user cart */
export async function mergeGuestCart({ userId, guestId }) {
  const redis = getRedisConnection();
  const gKey = guestKey(guestId);
  const gRaw = await redis.get(gKey);
  if (!gRaw) return;
  const guestCart = JSON.parse(gRaw);
  const userCart = await getCart({ userId });
  // sum quantities for same SKU
  for (const gItem of guestCart.items) {
    const uItem = userCart.items.find(i => i.sku === gItem.sku);
    if (uItem) uItem.quantity += gItem.quantity;
    else userCart.items.push(gItem);
  }
  await saveCart({ userId, cart: userCart });
  await redis.del(gKey);
}

/** Generate a new guest identifier (client should store in cookie) */
export function generateGuestId() {
  return uuidv4();
}
