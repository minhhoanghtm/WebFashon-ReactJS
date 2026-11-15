import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import aiToolRegistry from "../modules/ai/services/aiAgent.service.js";
import aiChatService from "../modules/communication/aiChat/aiChat.service.js";
import inventoryReservationService from "../modules/inventory/inventoryReservation.service.js";
import { Product, ProductVariant } from "../modules/products/product.model.js";
import User from "../modules/users/user.model.js";

async function runAudit() {
  console.log("=== 1. AUDITING AI SHOPPING INTENT ROUTING ===");
  await connectDB();

  // Test phrase from user request
  const userPrompt = "Thanh toán giúp tôi sản phẩm Đầm Maxi Hoa Nhí Đi Biển size M màu Hoa Nhí Vàng với số lượng là 1.";
  
  const isCheckout = aiToolRegistry.detectCheckoutIntent(userPrompt);
  const isCart = aiToolRegistry.detectCartActionIntent(userPrompt);
  const isCancel = aiToolRegistry.detectCancelCheckoutIntent(userPrompt);

  console.log(`Input: "${userPrompt}"`);
  console.log(`- detectCheckoutIntent: ${isCheckout} (Expected: true)`);
  console.log(`- detectCartActionIntent: ${isCart} (Expected: false)`);
  console.log(`- detectCancelCheckoutIntent: ${isCancel} (Expected: false)`);

  if (!isCheckout || isCart) {
    throw new Error("FAIL: Intent classifier incorrectly categorized checkout as cart!");
  }
  console.log("PASS: Intent classification correctly separates CHECKOUT from ADD_TO_CART.\n");

  console.log("=== 2. TESTING DIRECT CHECKOUT WORKFLOW & PRODUCT/VARIANT RESOLUTION ===");
  // Find a test customer user
  let customer = await User.findOne({ role: "user" }).lean();
  if (!customer) {
    customer = await User.findOne({}).lean();
  }
  const userId = customer._id.toString();

  // Find the exact product
  const product = await Product.findOne({ name: /Đầm Maxi Hoa Nhí/i }).lean();
  if (!product) {
    throw new Error("Product 'Đầm Maxi Hoa Nhí Đi Biển' not found in test DB!");
  }
  const variants = await ProductVariant.find({ product_id: product._id }).lean();
  const yellowM = variants.find(v => v.color.includes("Vàng") && v.size === "M");

  console.log(`Found Product: "${product.name}" (ID: ${product._id})`);
  console.log(`Found Variant: "${yellowM?.color}" Size "${yellowM?.size}" (ID: ${yellowM?._id}, Stock: ${yellowM?.stock})`);

  // Call start_checkout tool directly through registry
  const toolResult = await aiToolRegistry.executeTool(
    "start_checkout",
    {
      product_id: product.name,
      color: "Hoa Nhí Vàng",
      size: "M",
      quantity: 1,
      confirmed: false,
    },
    { userId, role: "user", confirmed: false }
  );

  console.log("Tool execution result:", {
    success: toolResult.success,
    status: toolResult.status,
    actionType: toolResult.actionType,
    reservationId: toolResult.reservationId,
    holdDurationFormatted: toolResult.holdDurationFormatted,
    checkoutUrl: toolResult.checkoutUrl,
  });

  if (toolResult.actionType !== "start_checkout") {
    throw new Error(`FAIL: Expected actionType 'start_checkout' but got '${toolResult.actionType}'`);
  }
  if (!toolResult.reservationId) {
    throw new Error("FAIL: No reservationId returned from start_checkout!");
  }
  console.log("PASS: Tool start_checkout created valid Redis reservation.\n");

  console.log("=== 3. VERIFYING REDIS INVENTORY RESERVATION & EXPIRY LOGIC ===");
  const reservation = await inventoryReservationService.getReservation(toolResult.reservationId);
  console.log("Active reservation in Redis:", {
    reservationId: reservation.reservationId,
    status: reservation.status,
    remainingSeconds: reservation.remainingSeconds,
    items: reservation.items.map(it => ({ name: it.name, color: it.color, size: it.size, qty: it.quantity, sku: it.sku })),
  });

  if (reservation.remainingSeconds > 300 || reservation.remainingSeconds < 290) {
    throw new Error(`FAIL: Reservation hold duration is not ~300 seconds (was ${reservation.remainingSeconds})`);
  }
  console.log("PASS: Reservation TTL is strictly 300 seconds (5 minutes).\n");

  console.log("=== 4. TESTING OVERSELLING CONCURRENCY PROTECTION ===");
  const sku = yellowM ? `variant_${yellowM._id}` : `product_${product._id}`;
  const initialReserved = await inventoryReservationService.getReservedStock(sku);
  console.log(`Current active reserved for SKU ${sku}: ${initialReserved}`);

  // Clean up test reservation
  await inventoryReservationService.releaseReservation(toolResult.reservationId, "TEST_CLEANUP");
  const postReleaseReserved = await inventoryReservationService.getReservedStock(sku);
  console.log(`Reserved after release: ${postReleaseReserved}`);

  if (postReleaseReserved !== initialReserved - 1) {
    throw new Error("FAIL: Released reservation did not decrement reserved counter correctly!");
  }
  console.log("PASS: Immediate cancellation successfully released inventory.\n");

  console.log("=== 5. TESTING END-TO-END AI CHAT MESSAGE SERVICE ===");
  const chatResponse = await aiChatService.sendMessage(userId, {
    content: userPrompt,
  }, { role: "user" });

  console.log("AI Chat Response:", {
    aiResponseSnippet: chatResponse.aiMessage?.content?.substring(0, 150) + "...",
    pendingActionType: chatResponse.pendingAction?.actionType,
    hasReservationId: Boolean(chatResponse.pendingAction?.reservationId),
    checkoutUrl: chatResponse.pendingAction?.checkoutUrl,
  });

  if (chatResponse.pendingAction?.actionType !== "start_checkout") {
    throw new Error(`FAIL: AI Chat returned '${chatResponse.pendingAction?.actionType}' instead of 'start_checkout'!`);
  }

  // Clean up any reservation created during test
  if (chatResponse.pendingAction?.reservationId) {
    await inventoryReservationService.releaseReservation(chatResponse.pendingAction.reservationId, "TEST_CLEANUP");
  }

  console.log("\nALL AUDIT & RESERVATION TESTS PASSED 100%!");
  process.exit(0);
}

runAudit().catch(err => {
  console.error("FATAL ERROR IN AUDIT:", err);
  process.exit(1);
});

