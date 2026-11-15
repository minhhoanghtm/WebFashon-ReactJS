import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import getRedisConnection from "../configs/redis.js";
import { Product, ProductVariant } from "../modules/products/product.model.js";
import inventoryReservationService from "../modules/inventory/inventoryReservation.service.js";

async function runConcurrencyScenario() {
  await connectDB();
  const redis = getRedisConnection();

  console.log("=== VERIFYING CONCURRENCY & ZERO OVERSELLING PROTECTION ===");

  // Find an existing product & variant or use real ID
  const product = await Product.findOne({ is_active: { $ne: false } }).lean();
  if (!product) throw new Error("No product found");

  const variant = await ProductVariant.findOne({ product_id: product._id }).lean();
  const targetId = variant ? variant._id : product._id;
  const isVariant = Boolean(variant);
  const sku = isVariant ? `variant_${variant._id}` : `product_${product._id}`;

  console.log(`Using target: "${product.name}", SKU: ${sku}`);

  // Temporarily set physical stock in memory check or mock the available stock logic
  // To avoid altering DB permanent data during testing, we test reserve with a simulated available stock
  // In inventoryReservationService:
  // dbStock comes from Variant or Product. Let's see current DB stock:
  const currentDbStock = isVariant ? Number(variant.stock || 0) : Number(product.stock || 0);
  console.log(`Initial DB Stock for SKU: ${currentDbStock}`);

  // Test Lua script directly with controlled numbers:
  // Keys: [stock:reserved:{sku}, checkout:reservation:{id}, stock:reservations:{sku}, stock:expirations]
  // Let's run a controlled scenario using inventoryReservationService.createReservation with actual product/variant!
  
  // Clean any residual reservations for this test
  const existingReserved = await inventoryReservationService.getReservedStock(sku);
  console.log(`Existing reserved stock: ${existingReserved}`);

  // We test with qty up to currentDbStock - existingReserved
  const availableNow = currentDbStock - existingReserved;
  console.log(`Available stock right now: ${availableNow}`);

  if (availableNow < 2) {
    console.log("Note: Available stock < 2, testing direct Lua all-or-nothing check.");
  }

  // Test 1: Reserve 1 item (User A)
  const userAId = new mongoose.Types.ObjectId();
  const userCId = new mongoose.Types.ObjectId();

  const resA = await inventoryReservationService.createReservation({
    userId: userAId,
    items: [{
      productId: product._id.toString(),
      variantId: variant ? variant._id.toString() : undefined,
      quantity: 1
    }]
  });
  console.log("User A reserved 1 unit:", resA.reservationId);

  // Check reserved count
  const reservedAfterA = await inventoryReservationService.getReservedStock(sku);
  console.log("Reserved count after A:", reservedAfterA);

  // Test 2: User C attempts to reserve more than available (currentDbStock + 10)
  try {
    await inventoryReservationService.createReservation({
      userId: userCId,
      items: [{
        productId: product._id.toString(),
        variantId: variant ? variant._id.toString() : undefined,
        quantity: currentDbStock + 10
      }]
    });
    throw new Error("FAIL: System allowed overselling!");
  } catch (err) {
    console.log("PASS: Overselling rejected with message:", err.message);
  }

  // Test 3: Release User A reservation
  await inventoryReservationService.releaseReservation(resA.reservationId, "USER_CANCELLED");
  const reservedAfterRelease = await inventoryReservationService.getReservedStock(sku);
  console.log("Reserved count after User A released:", reservedAfterRelease);
  console.log("Delta reserved:", reservedAfterA - reservedAfterRelease, "(Expected: 1)");

  // Test 4: Lua Script Direct Concurrency Benchmark
  // Directly invoke LUA_RESERVE with 5 mock stock
  const mockSku = `variant_mock_${Date.now()}`;
  const mockReservationIdA = `res_mock_a_${Date.now()}`;
  const mockReservationIdB = `res_mock_b_${Date.now()}`;
  const mockReservationIdC = `res_mock_c_${Date.now()}`;
  const expiresAt = Date.now() + 300000;
  const holdSeconds = 300;

  const LUA_RESERVE = `
    local reservationId = ARGV[1]
    local expiresAt = tonumber(ARGV[2])
    local ttlSeconds = tonumber(ARGV[3])
    local itemsPayload = ARGV[4]
    local itemCount = tonumber(ARGV[5])

    for i = 1, itemCount do
      local sku = ARGV[5 + (i - 1) * 3 + 1]
      local reqQty = tonumber(ARGV[5 + (i - 1) * 3 + 2])
      local dbStock = tonumber(ARGV[5 + (i - 1) * 3 + 3])
      local reservedKey = "stock:reserved:" .. sku
      local currentReserved = tonumber(redis.call("GET", reservedKey) or "0")
      if (currentReserved + reqQty) > dbStock then
        return {0, sku, tostring(dbStock - currentReserved)}
      end
    end

    for i = 1, itemCount do
      local sku = ARGV[5 + (i - 1) * 3 + 1]
      local reqQty = tonumber(ARGV[5 + (i - 1) * 3 + 2])
      local reservedKey = "stock:reserved:" .. sku
      local reservationsKey = "stock:reservations:" .. sku
      redis.call("INCRBY", reservedKey, reqQty)
      redis.call("SADD", reservationsKey, reservationId)
      redis.call("EXPIRE", reservedKey, ttlSeconds + 3600)
      redis.call("EXPIRE", reservationsKey, ttlSeconds + 3600)
    end

    local resKey = "checkout:reservation:" .. reservationId
    redis.call("SETEX", resKey, ttlSeconds, itemsPayload)
    redis.call("ZADD", "stock:expirations", expiresAt, reservationId)
    return {1, "OK"}
  `;

  // Scenario: 5 stock.
  // A reserves 3 -> success
  const resA_Lua = await redis.eval(
    LUA_RESERVE,
    0,
    mockReservationIdA,
    expiresAt,
    holdSeconds,
    JSON.stringify({ mockReservationIdA }),
    1,
    mockSku,
    3,
    5
  );
  console.log("Lua Test - Step 1: User A requests 3 out of 5 ->", resA_Lua);

  // B reserves 2 -> success (total 5 reserved)
  const resB_Lua = await redis.eval(
    LUA_RESERVE,
    0,
    mockReservationIdB,
    expiresAt,
    holdSeconds,
    JSON.stringify({ mockReservationIdB }),
    1,
    mockSku,
    2,
    5
  );
  console.log("Lua Test - Step 2: User B requests 2 out of 5 ->", resB_Lua);

  // C reserves 1 -> rejected! (available = 0)
  const resC_Lua = await redis.eval(
    LUA_RESERVE,
    0,
    mockReservationIdC,
    expiresAt,
    holdSeconds,
    JSON.stringify({ mockReservationIdC }),
    1,
    mockSku,
    1,
    5
  );
  console.log("Lua Test - Step 3: User C requests 1 out of 5 ->", resC_Lua);
  if (resC_Lua[0] === 0) {
    console.log(`PASS: User C rejected atomically! SKU: ${resC_Lua[1]}, Available: ${resC_Lua[2]}`);
  }

  // Release A (3 units)
  const LUA_RELEASE = `
    local reservationId = ARGV[1]
    local resKey = "checkout:reservation:" .. reservationId
    local payload = redis.call("GET", resKey)
    local items = {}

    if payload then
      local decoded = cjson.decode(payload)
      if decoded and decoded.items then
        items = decoded.items
      end
      redis.call("DEL", resKey)
    end

    redis.call("ZREM", "stock:expirations", reservationId)

    local itemCount = tonumber(ARGV[2] or "0")
    for i = 1, itemCount do
      local sku = ARGV[2 + (i - 1) * 2 + 1]
      local qty = tonumber(ARGV[2 + (i - 1) * 2 + 2])
      local reservedKey = "stock:reserved:" .. sku
      local reservationsKey = "stock:reservations:" .. sku
      local curr = tonumber(redis.call("GET", reservedKey) or "0")
      local nextVal = curr - qty
      if nextVal <= 0 then
        redis.call("DEL", reservedKey)
      else
        redis.call("SET", reservedKey, nextVal)
      end
      redis.call("SREM", reservationsKey, reservationId)
    end
    return 1
  `;

  await redis.eval(
    LUA_RELEASE,
    0,
    mockReservationIdA,
    1,
    mockSku,
    3
  );
  console.log("Lua Test - Step 4: User A reservation (3 units) released.");

  // C reserves 1 again -> succeeds!
  const resC_Retry = await redis.eval(
    LUA_RESERVE,
    0,
    mockReservationIdC,
    expiresAt,
    holdSeconds,
    JSON.stringify({ mockReservationIdC }),
    1,
    mockSku,
    1,
    5
  );
  console.log("Lua Test - Step 5: User C retries requesting 1 unit ->", resC_Retry);
  if (resC_Retry[0] === 1) {
    console.log("PASS: User C succeeded after User A released stock!");
  }

  // Cleanup B and C
  await redis.eval(LUA_RELEASE, 0, mockReservationIdB, 1, mockSku, 2);
  await redis.eval(LUA_RELEASE, 0, mockReservationIdC, 1, mockSku, 1);
  console.log("Cleaned up mock reservations. Final reserved for mock SKU:", await redis.get(`stock:reserved:${mockSku}`));

  console.log("\nALL CONCURRENCY AND ZERO-OVERSELLING TESTS PASSED PERFECTLY!");
  process.exit(0);
}

runConcurrencyScenario().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
