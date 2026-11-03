import crypto from "crypto";
import mongoose from "mongoose";
import { getRedisConnection } from "../../configs/redis.js";
import InventoryReservation from "./inventoryReservation.model.js";
import { Product, ProductVariant } from "../products/product.model.js";
import UserEvent from "../tracking/userEvent.model.js";
import { EVENT_TYPES } from "../tracking/tracking.constants.js";
import logger from "../../common/logger.js";

export const HOLD_DURATION_SECONDS = 300; // Exactly 5 minutes (300s)

export const KEY_PREFIX_RES = "webfashion:reservation:";
export const KEY_PREFIX_STOCK_RESERVED = "webfashion:stock:reserved:";
export const KEY_PREFIX_STOCK_RESERVATIONS = "webfashion:stock:reservations:";
export const KEY_EXPIRATIONS_ZSET = "webfashion:reservation:expirations";
export const KEY_IDEMPOTENCY_PREFIX = "webfashion:checkout:idempotency:";

const LUA_RESERVE = `
local resKey = KEYS[1]
local expirationsKey = KEYS[2]
local resId = ARGV[1]
local resJson = ARGV[2]
local expiresAtMs = tonumber(ARGV[3])
local ttlSec = tonumber(ARGV[4])
local numItems = tonumber(ARGV[5])
local baseIdx = 6

-- Check availability for all items first (All-or-nothing check)
for i = 1, numItems do
  local sku = ARGV[baseIdx + (i - 1) * 3]
  local requested = tonumber(ARGV[baseIdx + (i - 1) * 3 + 1])
  local dbStock = tonumber(ARGV[baseIdx + (i - 1) * 3 + 2])
  local reservedKey = "webfashion:stock:reserved:" .. sku
  local currentReserved = tonumber(redis.call("GET", reservedKey) or "0")
  local available = dbStock - currentReserved
  if available < requested then
    return cjson.encode({
      success = false,
      code = "INSUFFICIENT_STOCK",
      sku = sku,
      available = math.max(0, available),
      requested = requested
    })
  end
end

-- All items passed, atomically increment reserved counts
for i = 1, numItems do
  local sku = ARGV[baseIdx + (i - 1) * 3]
  local requested = tonumber(ARGV[baseIdx + (i - 1) * 3 + 1])
  local reservedKey = "webfashion:stock:reserved:" .. sku
  local reservationsKey = "webfashion:stock:reservations:" .. sku
  redis.call("INCRBY", reservedKey, requested)
  redis.call("SADD", reservationsKey, resId)
end

-- Store reservation data with exact TTL
redis.call("SET", resKey, resJson, "EX", ttlSec)
redis.call("ZADD", expirationsKey, expiresAtMs, resId)

return cjson.encode({ success = true, reservationId = resId })
`;

const LUA_RELEASE = `
local resKey = KEYS[1]
local expirationsKey = KEYS[2]
local resId = ARGV[1]
local reason = ARGV[2]
local updatedJson = ARGV[3]

local raw = redis.call("GET", resKey)
if not raw then
  redis.call("ZREM", expirationsKey, resId)
  return cjson.encode({ success = true, code = "ALREADY_CLEANED" })
end

local res = cjson.decode(raw)
if res.status ~= "ACTIVE" then
  redis.call("ZREM", expirationsKey, resId)
  return cjson.encode({ success = true, code = "ALREADY_RELEASED", status = res.status })
end

-- Decrement reserved count for each SKU
if res.items then
  for _, item in ipairs(res.items) do
    local sku = item.sku
    local qty = tonumber(item.quantity or 1)
    local reservedKey = "webfashion:stock:reserved:" .. sku
    local reservationsKey = "webfashion:stock:reservations:" .. sku
    local current = tonumber(redis.call("GET", reservedKey) or "0")
    local newReserved = math.max(0, current - qty)
    if newReserved > 0 then
      redis.call("SET", reservedKey, tostring(newReserved))
    else
      redis.call("DEL", reservedKey)
    end
    redis.call("SREM", reservationsKey, resId)
  end
end

redis.call("ZREM", expirationsKey, resId)

if updatedJson and updatedJson ~= "" then
  redis.call("SET", resKey, updatedJson, "EX", 3600)
else
  redis.call("DEL", resKey)
end

return cjson.encode({ success = true, status = reason })
`;

const LUA_COMMIT = `
local resKey = KEYS[1]
local expirationsKey = KEYS[2]
local resId = ARGV[1]
local updatedJson = ARGV[2]

local raw = redis.call("GET", resKey)
if not raw then
  redis.call("ZREM", expirationsKey, resId)
  return cjson.encode({ success = true, code = "ALREADY_CLEANED" })
end

local res = cjson.decode(raw)
if res.items then
  for _, item in ipairs(res.items) do
    local sku = item.sku
    local qty = tonumber(item.quantity or 1)
    local reservedKey = "webfashion:stock:reserved:" .. sku
    local reservationsKey = "webfashion:stock:reservations:" .. sku
    local current = tonumber(redis.call("GET", reservedKey) or "0")
    local newReserved = math.max(0, current - qty)
    if newReserved > 0 then
      redis.call("SET", reservedKey, tostring(newReserved))
    else
      redis.call("DEL", reservedKey)
    end
    redis.call("SREM", reservationsKey, resId)
  end
end

redis.call("ZREM", expirationsKey, resId)

if updatedJson and updatedJson ~= "" then
  redis.call("SET", resKey, updatedJson, "EX", 86400)
end

return cjson.encode({ success = true, status = "COMPLETED" })
`;

class InventoryReservationService {
  constructor() {
    this._reconcileInterval = null;
    this._startBackgroundReconciliation();
  }

  getRedis() {
    return getRedisConnection();
  }

  /**
   * Helper to derive canonical SKU string for reservation.
   */
  getSku(productId, variantId) {
    if (variantId && String(variantId) !== "null" && String(variantId) !== "undefined") {
      return `variant_${variantId}`;
    }
    return `product_${productId}`;
  }

  /**
   * Get active reserved quantity in Redis for a given SKU.
   */
  async getReservedStock(sku) {
    try {
      const redis = this.getRedis();
      const val = await redis.get(`${KEY_PREFIX_STOCK_RESERVED}${sku}`);
      return Math.max(0, parseInt(val || "0", 10));
    } catch (e) {
      logger.warn("Redis getReservedStock error, falling back to 0:", e.message);
      return 0;
    }
  }

  /**
   * Query real-time available stock factoring in Redis active reservations.
   */
  async getAvailableStock(productId, variantId = null) {
    let dbStock = 0;
    if (variantId && mongoose.isValidObjectId(variantId)) {
      const variant = await ProductVariant.findById(variantId).select("stock").lean();
      dbStock = Number(variant?.stock || 0);
    } else if (productId && mongoose.isValidObjectId(productId)) {
      const product = await Product.findById(productId).select("stock").lean();
      dbStock = Number(product?.stock || 0);
    }
    const sku = this.getSku(productId, variantId);
    const reserved = await this.getReservedStock(sku);
    return Math.max(0, dbStock - reserved);
  }

  /**
   * Create an atomic 300s inventory reservation in Redis and durable ledger in MongoDB.
   */
  async createReservation({
    userId,
    items = [],
    checkoutSessionId = null,
    idempotencyKey = null,
    durationSeconds = HOLD_DURATION_SECONDS,
  }) {
    if (!userId) {
      throw new Error("userId là bắt buộc để giữ hàng");
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Danh sách sản phẩm giữ hàng không được trống");
    }

    const redis = this.getRedis();

    // Check idempotency if key supplied
    if (idempotencyKey) {
      const existing = await InventoryReservation.findOne({
        userId,
        idempotencyKey,
        status: "ACTIVE",
        expiresAt: { $gt: new Date() },
      }).lean();
      if (existing) {
        return this.formatReservation(existing);
      }
    }

    // 1. Verify DB stock for each item & assemble Lua arguments
    const preparedItems = [];
    const luaArgs = [];

    for (const it of items) {
      const productId = String(it.productId || it.product_id);
      const variantId = it.variantId || it.variant_id ? String(it.variantId || it.variant_id) : null;
      const quantity = Math.max(1, parseInt(it.quantity || 1, 10));
      const sku = this.getSku(productId, variantId);

      let dbStock = 0;
      let name = it.name || "Sản phẩm";
      let color = it.color || "";
      let size = it.size || "";
      let unitPrice = Number(it.unitPrice ?? it.price ?? 0);
      let image = it.image || "";

      if (variantId && mongoose.isValidObjectId(variantId)) {
        const variant = await ProductVariant.findById(variantId).lean();
        if (!variant) {
          throw new Error(`Biến thể không tồn tại (ID: ${variantId})`);
        }
        dbStock = Number(variant.stock || 0);
        color = variant.color || color;
        size = variant.size || size;
        if (variant.image_url) image = variant.image_url;

        const parentProd = await Product.findById(productId).select("name new_price displayProduct").lean();
        if (parentProd) {
          name = parentProd.name;
          if (!unitPrice) unitPrice = Number(parentProd.new_price || 0);
          if (!image && parentProd.displayProduct?.[0]) image = parentProd.displayProduct[0];
        }
      } else {
        const product = await Product.findById(productId).lean();
        if (!product) {
          throw new Error(`Sản phẩm không tồn tại (ID: ${productId})`);
        }
        dbStock = Number(product.stock || 0);
        name = product.name;
        if (!unitPrice) unitPrice = Number(product.new_price || 0);
        if (!image && product.displayProduct?.[0]) image = product.displayProduct[0];
      }

      preparedItems.push({
        productId,
        variantId,
        sku,
        name,
        color,
        size,
        quantity,
        unitPrice,
        image,
      });

      // Triplet for Lua: sku, requestedQty, dbStock
      luaArgs.push(sku, String(quantity), String(dbStock));
    }

    const reservationId = `res_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const now = Date.now();
    const expiresAtMs = now + durationSeconds * 1000;
    const expiresAt = new Date(expiresAtMs);
    const totalAmount = preparedItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);

    const reservationPayload = {
      reservationId,
      userId: String(userId),
      checkoutSessionId: checkoutSessionId || `cs_${reservationId}`,
      items: preparedItems,
      totalAmount,
      status: "ACTIVE",
      createdAt: now,
      expiresAt: expiresAtMs,
      idempotencyKey,
    };

    // 2. Execute Atomic Lua Reservation in Redis
    const resKey = `${KEY_PREFIX_RES}${reservationId}`;
    const resultRaw = await redis.eval(
      LUA_RESERVE,
      2,
      resKey,
      KEY_EXPIRATIONS_ZSET,
      reservationId,
      JSON.stringify(reservationPayload),
      String(expiresAtMs),
      String(durationSeconds),
      String(preparedItems.length),
      ...luaArgs
    );

    const resResult = typeof resultRaw === "string" ? JSON.parse(resultRaw) : resultRaw;
    if (!resResult.success) {
      UserEvent.create({
        event_id: new mongoose.Types.ObjectId().toString(),
        event_type: EVENT_TYPES.CHECKOUT_STOCK_INSUFFICIENT,
        user_id: mongoose.isValidObjectId(userId) ? userId : null,
        meta: {
          sku: resResult.sku,
          available: resResult.available,
          requested: resResult.requested,
        },
      }).catch(() => {});

      throw Object.assign(
        new Error(
          `Sản phẩm hiện không đủ số lượng khả dụng trong kho (Còn lại: ${resResult.available}, yêu cầu: ${resResult.requested})`
        ),
        {
          statusCode: 409,
          code: resResult.code,
          sku: resResult.sku,
          available: resResult.available,
        }
      );
    }

    // 3. Persist in MongoDB durable ledger for crash recovery
    try {
      await InventoryReservation.create({
        reservationId,
        userId,
        checkoutSessionId: reservationPayload.checkoutSessionId,
        items: preparedItems,
        totalAmount,
        status: "ACTIVE",
        idempotencyKey,
        expiresAt,
      });

      UserEvent.create({
        event_id: new mongoose.Types.ObjectId().toString(),
        event_type: EVENT_TYPES.CHECKOUT_RESERVATION_CREATED,
        user_id: mongoose.isValidObjectId(userId) ? userId : null,
        meta: {
          reservation_id: reservationId,
          checkout_session_id: reservationPayload.checkoutSessionId,
          total_amount: totalAmount,
          item_count: preparedItems.length,
          expires_at: expiresAt,
        },
      }).catch(() => {});
    } catch (dbErr) {
      logger.error("Failed to persist durable reservation ledger, releasing Redis hold:", dbErr);
      await this.releaseReservation(reservationId, "FAILED_PERSIST");
      throw new Error("Lỗi hệ thống khi lưu trữ phiên giữ hàng. Vui lòng thử lại.");
    }

    return this.formatReservation(reservationPayload);
  }

  /**
   * Fetch reservation by ID (checks Redis first, falls back to DB, auto-expires if past TTL).
   */
  async getReservation(reservationId) {
    if (!reservationId) return null;
    const redis = this.getRedis();
    const resKey = `${KEY_PREFIX_RES}${reservationId}`;

    let data = null;
    try {
      const cached = await redis.get(resKey);
      if (cached) {
        data = JSON.parse(cached);
      }
    } catch (e) {
      logger.warn("Redis getReservation cache miss/error:", e.message);
    }

    if (!data) {
      const doc = await InventoryReservation.findOne({ reservationId }).lean();
      if (!doc) return null;
      data = doc;
    }

    const now = Date.now();
    const expiresAtMs = new Date(data.expiresAt).getTime();

    // Lazy expiration check
    if (data.status === "ACTIVE" && now >= expiresAtMs) {
      await this.releaseReservation(reservationId, "EXPIRED");
      data.status = "EXPIRED";
    }

    return this.formatReservation(data);
  }

  /**
   * Release reservation immediately (User cancel, or 300s expired).
   */
  async releaseReservation(reservationId, reason = "RELEASED") {
    if (!reservationId) return false;
    const redis = this.getRedis();
    const resKey = `${KEY_PREFIX_RES}${reservationId}`;

    // Update in Redis via atomic Lua
    const updatedPayload = { status: reason, releasedAt: Date.now() };
    try {
      await redis.eval(
        LUA_RELEASE,
        2,
        resKey,
        KEY_EXPIRATIONS_ZSET,
        reservationId,
        reason,
        JSON.stringify(updatedPayload)
      );
    } catch (e) {
      logger.error("Error executing LUA_RELEASE in Redis:", e.message);
    }

    // Update MongoDB ledger
    try {
      await InventoryReservation.updateOne(
        { reservationId, status: "ACTIVE" },
        {
          $set: {
            status: reason === "EXPIRED" ? "EXPIRED" : "RELEASED",
            releasedAt: new Date(),
          },
        }
      );

      const isExpired = reason === "EXPIRED";
      UserEvent.create({
        event_id: new mongoose.Types.ObjectId().toString(),
        event_type: isExpired
          ? EVENT_TYPES.CHECKOUT_RESERVATION_EXPIRED
          : EVENT_TYPES.CHECKOUT_RESERVATION_CANCELLED,
        meta: { reservation_id: reservationId, reason },
      }).catch(() => {});
    } catch (dbErr) {
      logger.error("Error updating MongoDB reservation status:", dbErr.message);
    }

    return true;
  }

  /**
   * Commit reservation upon successful order placement.
   */
  async commitReservation(reservationId, orderId = null) {
    if (!reservationId) return false;
    const redis = this.getRedis();
    const resKey = `${KEY_PREFIX_RES}${reservationId}`;

    const updatedPayload = { status: "COMPLETED", orderId, completedAt: Date.now() };
    try {
      await redis.eval(
        LUA_COMMIT,
        2,
        resKey,
        KEY_EXPIRATIONS_ZSET,
        reservationId,
        JSON.stringify(updatedPayload)
      );
    } catch (e) {
      logger.error("Error executing LUA_COMMIT in Redis:", e.message);
    }

    // Update MongoDB ledger
    try {
      await InventoryReservation.updateOne(
        { reservationId },
        {
          $set: {
            status: "COMPLETED",
            orderId: orderId || null,
            completedAt: new Date(),
          },
        }
      );

      UserEvent.create({
        event_id: new mongoose.Types.ObjectId().toString(),
        event_type: EVENT_TYPES.CHECKOUT_RESERVATION_CONFIRMED,
        meta: { reservation_id: reservationId, order_id: orderId },
      }).catch(() => {});
    } catch (dbErr) {
      logger.error("Error committing MongoDB reservation ledger:", dbErr.message);
    }

    return true;
  }

  /**
   * Process all expired reservations using ZRANGEBYSCORE in Redis.
   */
  async processExpiredReservations() {
    try {
      const redis = this.getRedis();
      const nowMs = Date.now();
      const expiredIds = await redis.zrangebyscore(KEY_EXPIRATIONS_ZSET, 0, nowMs);

      if (Array.isArray(expiredIds) && expiredIds.length > 0) {
        for (const resId of expiredIds) {
          await this.releaseReservation(resId, "EXPIRED");
        }
        logger.info(`Released ${expiredIds.length} expired inventory reservations`);
      }
    } catch (err) {
      // In case Redis is temporarily disconnected
    }
  }

  /**
   * Reconcile Redis reservations from durable MongoDB ledger (used on crash/restart recovery).
   */
  async reconcileReservationsFromDB() {
    try {
      const redis = this.getRedis();
      const now = new Date();
      const nowMs = now.getTime();

      // Find all ACTIVE reservations in MongoDB
      const activeReservations = await InventoryReservation.find({
        status: "ACTIVE",
      }).lean();

      let recovered = 0;
      let expiredCount = 0;

      for (const res of activeReservations) {
        const expiresAtMs = new Date(res.expiresAt).getTime();
        if (expiresAtMs <= nowMs) {
          // Has expired while server/redis was off
          await InventoryReservation.updateOne(
            { _id: res._id },
            { $set: { status: "EXPIRED", releasedAt: now } }
          );
          expiredCount++;
        } else {
          // Re-populate into Redis
          const remainingSec = Math.max(1, Math.floor((expiresAtMs - nowMs) / 1000));
          const resKey = `${KEY_PREFIX_RES}${res.reservationId}`;

          for (const item of res.items) {
            const sku = item.sku;
            const qty = item.quantity;
            await redis.incrby(`${KEY_PREFIX_STOCK_RESERVED}${sku}`, qty);
            await redis.sadd(`${KEY_PREFIX_STOCK_RESERVATIONS}${sku}`, res.reservationId);
          }

          await redis.set(resKey, JSON.stringify(res), "EX", remainingSec);
          await redis.zadd(KEY_EXPIRATIONS_ZSET, expiresAtMs, res.reservationId);
          recovered++;
        }
      }

      logger.info(
        `Inventory Reservation Reconcile Complete: ${recovered} active recovered, ${expiredCount} expired marked`
      );
    } catch (e) {
      logger.error("Error during reconcileReservationsFromDB:", e.message);
    }
  }

  formatReservation(data) {
    const rawExpiresAt = data.expiresAt;
    let expiresAtMs =
      typeof rawExpiresAt === "number"
        ? rawExpiresAt
        : new Date(rawExpiresAt || Date.now()).getTime();

    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= 0) {
      expiresAtMs = Date.now();
    }

    const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
    const items = data.items || [];
    return {
      reservationId: data.reservationId,
      userId: String(data.userId),
      checkoutSessionId: data.checkoutSessionId,
      status: remainingSeconds <= 0 && data.status === "ACTIVE" ? "EXPIRED" : data.status,
      reservedItems: items.map((it) => ({
        sku: it.sku,
        productId: it.productId,
        variantId: it.variantId,
        quantity: it.quantity,
        name: it.name,
        color: it.color,
        size: it.size,
        unitPrice: it.unitPrice,
        image: it.image,
      })),
      items,
      totalAmount: data.totalAmount,
      totalAmountFormatted: `${Number(data.totalAmount || 0).toLocaleString("vi-VN")}đ`,
      expiresAt: expiresAtMs,
      expiresAtDate: new Date(expiresAtMs).toISOString(),
      serverTime: Date.now(),
      remainingSeconds,
      holdDurationSeconds: HOLD_DURATION_SECONDS,
      holdDurationFormatted: `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(
        remainingSeconds % 60
      ).padStart(2, "0")}`,
    };
  }

  _startBackgroundReconciliation() {
    if (this._reconcileInterval) return;
    this._reconcileInterval = setInterval(() => {
      this.processExpiredReservations().catch(() => {});
    }, 10000); // Check every 10 seconds
  }
}

const inventoryReservationService = new InventoryReservationService();
export default inventoryReservationService;

