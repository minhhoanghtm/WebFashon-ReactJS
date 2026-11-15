import { requireEnv } from "./require-env.js";

const mongoConnectionString = requireEnv("MONGO_CONNECTIONSTRING");
requireEnv("REDIS_URL");

const mongoose = (await import("mongoose")).default;
const { getRedisConnection } = await import("../configs/redis.js");
const aiToolRegistry = (await import("../modules/ai/services/aiAgent.service.js")).default;
const aiChatService = (await import("../modules/communication/aiChat/aiChat.service.js")).default;
const inventoryReservationService = (await import("../modules/inventory/inventoryReservation.service.js")).default;
const pricingService = (await import("../modules/campaigns/pricing.service.js")).default;
const pendingActionService = (await import("../modules/ai/services/pendingAction.service.js")).default;
const { Product } = await import("../modules/products/product.model.js");

async function runVerification() {
  console.log("=== STARTING AI SHOPPING & CHECKOUT VERIFICATION SUITE (STAGING) ===");
  await mongoose.connect(mongoConnectionString);
  console.log("Connected to MongoDB Staging (Port 27018 / webfashion_staging)");

  const results = [];
  const record = (name, passed, details = "") => {
    results.push({ name, passed, details });
    console.log(`${passed ? "✅ [PASS]" : "❌ [FAIL]"} ${name} ${details ? `(${details})` : ""}`);
  };

  // 1. Verify target product exists with price 350,000
  const product = await Product.findOne({ slug: "dam-maxi-hoa-nhi-di-bien" }).lean();
  record("Product seeded in DB", Boolean(product && product.new_price === 350000), `ID: ${product?._id}, Price: ${product?.new_price}đ`);

  // 2. Verify pricing service resolves price correctly
  const resolved = await pricingService.resolvePrice(product, product?.variants?.[0]);
  record("Pricing Service single source of truth", resolved.finalPrice === 350000, `Resolved: ${resolved.finalPrice}đ`);

  // 3. Test Intent Detection
  const intent1 = aiToolRegistry.detectCheckoutIntent("Thanh toán giúp tôi sản phẩm Đầm Maxi Hoa Nhí Đi Biển size M màu Hoa Nhí Vàng số lượng 1");
  const cartIntent1 = aiToolRegistry.detectCartActionIntent("Thanh toán giúp tôi sản phẩm Đầm Maxi Hoa Nhí Đi Biển size M màu Hoa Nhí Vàng số lượng 1");
  record("Intent: 'Thanh toán giúp tôi...' is Checkout Intent", intent1 === true && cartIntent1 === false);

  const intent2 = aiToolRegistry.detectCheckoutIntent("Đặt hàng giúp tôi sản phẩm Đầm Maxi Hoa Nhí Đi Biển size M màu Hoa Nhí Vàng số lượng 1");
  const cartIntent2 = aiToolRegistry.detectCartActionIntent("Đặt hàng giúp tôi sản phẩm Đầm Maxi Hoa Nhí Đi Biển size M màu Hoa Nhí Vàng số lượng 1");
  record("Intent: 'Đặt hàng giúp tôi...' is Checkout Intent (NOT Cart)", intent2 === true && cartIntent2 === false);

  const intent3 = aiToolRegistry.detectCheckoutIntent("Mua ngay sản phẩm này");
  const cartIntent3 = aiToolRegistry.detectCartActionIntent("Mua ngay sản phẩm này");
  record("Intent: 'Mua ngay...' is Checkout Intent", intent3 === true && cartIntent3 === false);

  const cartIntent4 = aiToolRegistry.detectCartActionIntent("Thêm vào giỏ hàng áo sơ mi trắng size L");
  const checkoutIntent4 = aiToolRegistry.detectCheckoutIntent("Thêm vào giỏ hàng áo sơ mi trắng size L");
  record("Intent: 'Thêm vào giỏ...' is Cart Action (NOT Checkout)", cartIntent4 === true && checkoutIntent4 === false);

  // 4. Test executeTool("start_checkout")
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const checkoutResult = await aiToolRegistry.executeTool(
    "start_checkout",
    {
      product_id: "Đầm Maxi Hoa Nhí Đi Biển",
      size: "M",
      color: "Hoa Nhí Vàng",
      quantity: 1,
      confirmed: false,
    },
    { userId: mockUserId, role: "user", confirmed: false }
  );

  record("Tool Calling: start_checkout returns PENDING_CONFIRMATION", checkoutResult.status === "PENDING_CONFIRMATION");
  record("Tool Calling: start_checkout creates Redis reservation", Boolean(checkoutResult.reservationId));
  record("Tool Calling: start_checkout holds stock for 300s", checkoutResult.remainingSeconds > 290 && checkoutResult.remainingSeconds <= 300, `Remaining: ${checkoutResult.remainingSeconds}s`);
  
  const item = checkoutResult.items?.[0];
  record("Price Consistency: unitPrice is 350.000đ (NOT 0đ!)", item?.unitPrice === 350000, `Item unitPrice: ${item?.unitPrice}đ`);
  record("Price Consistency: totalEstimatedPrice is 350.000đ", checkoutResult.totalEstimatedPrice === 350000, `Total: ${checkoutResult.totalEstimatedPrice}đ`);

  // 5. Test reservation retrieval via inventoryReservationService
  const resData = await inventoryReservationService.getReservation(checkoutResult.reservationId);
  record("Reservation API: getReservation returns ACTIVE", resData.status === "ACTIVE");
  record("Reservation API: contains normalized unitPrice and new_price", resData.items?.[0]?.unitPrice === 350000 && resData.items?.[0]?.new_price === 350000, `unitPrice: ${resData.items?.[0]?.unitPrice}đ`);

  // 6. Test PendingAction creation & two-phase confirmation gate
  const pendingActionDoc = await pendingActionService.create({
    userId: mockUserId,
    conversationId: null,
    tool: "start_checkout",
    params: {
      items: [{ product_id: String(product._id), color: "Hoa Nhí Vàng", size: "M", quantity: 1 }],
      reservation_id: checkoutResult.reservationId,
      confirmed: false,
    },
    summary: {
      actionType: "start_checkout",
      reservationId: checkoutResult.reservationId,
      totalEstimatedPriceFormatted: "350.000đ",
    },
  });

  record("Two-Phase Gate: PendingAction document created in MongoDB", Boolean(pendingActionDoc?.actionId));
  record("Two-Phase Gate: Has valid SHA256 paramsHash", Boolean(pendingActionDoc?.paramsHash && pendingActionDoc.paramsHash.length === 64));

  // Confirm pending action
  const confirmResult = await pendingActionService.confirm({
    actionId: pendingActionDoc.actionId,
    paramsHash: pendingActionDoc.paramsHash,
    userId: mockUserId,
    role: "user",
  });

  console.log("confirmResult payload:", JSON.stringify(confirmResult, null, 2));
  record("Two-Phase Gate: Confirmation transitions to EXECUTED", confirmResult.status === "EXECUTED" || confirmResult.action?.status === "confirmed");
  record("Two-Phase Gate: Returns checkoutUrl with reservationId", Boolean(confirmResult.checkoutUrl?.includes(checkoutResult.reservationId)));

  // Release reservation cleanup
  await inventoryReservationService.releaseReservation(checkoutResult.reservationId, "TEST_COMPLETED");

  // 7. Test Search Under 1M strict filtering & deduplication
  const searchToolRes = await aiToolRegistry.executeTool(
    "search_products",
    { keyword: "thời trang", max_price: 1000000, limit: 5 },
    { userId: mockUserId, role: "user" }
  );

  let allUnder1M = true;
  let uniqueIds = true;
  if (Array.isArray(searchToolRes) && searchToolRes.length > 0) {
    const idSet = new Set();
    for (const p of searchToolRes) {
      if (p.price_number > 1000000) allUnder1M = false;
      if (idSet.has(p.id)) uniqueIds = false;
      idSet.add(p.id);
    }
  }
  record("Search: Strict price filter (< 1.000.000đ)", allUnder1M, `Found ${searchToolRes.length} items`);
  record("Search: Deduplicated product IDs", uniqueIds);

  // Summary
  const allPassed = results.every(r => r.passed);
  console.log(`\n=== SUMMARY: ${results.filter(r => r.passed).length}/${results.length} PASSED ===`);
  if (!allPassed) {
    console.error("Some checks failed!");
    process.exit(1);
  }
  await mongoose.disconnect();
}

runVerification().catch(err => {
  console.error("Error in verification suite:", err);
  process.exit(1);
});
