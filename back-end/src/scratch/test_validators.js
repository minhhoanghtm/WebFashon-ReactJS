/**
 * Test script xác minh tất cả Zod validators hoạt động đúng.
 * Chạy: node src/scratch/test_validators.js
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Import tất cả validators
// ---------------------------------------------------------------------------
import * as authV   from "../modules/auth/auth.validator.js";
import * as userV   from "../modules/users/user.validator.js";
import * as orderV  from "../modules/orders/order.validator.js";
import * as bannerV from "../modules/banners/banner.validator.js";
import * as wsV     from "../modules/websiteSettings/websiteSettings.validator.js";
import * as pageV   from "../modules/pages/page.validator.js";
import * as psV     from "../modules/pageSections/pageSection.validator.js";
import * as commV   from "../modules/communication/validators/communication.validator.js";

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function mockReq(body = {}, params = {}, query = {}) {
  return { body, params, query };
}

function mockRes() {
  return {};
}

function testMiddleware(label, middlewareFn, req, expectPass) {
  return new Promise((resolve) => {
    let nextCalled = false;
    let nextError = null;

    const next = (err) => {
      nextCalled = true;
      nextError = err || null;
    };

    try {
      middlewareFn(req, mockRes(), next);
    } catch (e) {
      nextError = e;
    }

    const didPass = expectPass ? (nextCalled && !nextError) : (nextCalled && nextError !== null);

    if (didPass) {
      console.log(`  ✅ [PASS] ${label}`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${label}`);
      if (expectPass && nextError) console.log(`         Error: ${nextError.message}`);
      if (!expectPass && !nextError) console.log(`         Expected error but none thrown`);
      failed++;
    }
    resolve();
  });
}

function testUtility(label, fn, ...args) {
  try {
    const result = fn(...args);
    console.log(`  ✅ [PASS] ${label}`, result !== undefined ? `→ ${JSON.stringify(result).slice(0, 60)}` : "");
    passed++;
  } catch (e) {
    console.log(`  ❌ [FAIL] ${label} → ${e.message}`);
    failed++;
  }
}

function testUtilityThrows(label, fn, ...args) {
  try {
    fn(...args);
    console.log(`  ❌ [FAIL] ${label} (expected error, but none thrown)`);
    failed++;
  } catch (e) {
    console.log(`  ✅ [PASS] ${label} → throws: ${e.message.slice(0, 80)}`);
    passed++;
  }
}

// ---------------------------------------------------------------------------
// [1] Auth validator tests
// ---------------------------------------------------------------------------
console.log("\n[auth.validator]");

await testMiddleware("signUp valid", authV.validateSignUp,
  mockReq({ email: "test@example.com", passWord: "password123", firstName: "John", lastName: "Doe" }), true);

await testMiddleware("signUp invalid email", authV.validateSignUp,
  mockReq({ email: "notanemail", passWord: "password123", firstName: "John", lastName: "Doe" }), false);

await testMiddleware("signUp password too short", authV.validateSignUp,
  mockReq({ email: "test@example.com", passWord: "123", firstName: "John", lastName: "Doe" }), false);

await testMiddleware("signUp missing firstName", authV.validateSignUp,
  mockReq({ email: "test@example.com", passWord: "password123", lastName: "Doe" }), false);

await testMiddleware("signIn valid", authV.validateSignIn,
  mockReq({ email: "test@example.com", passWord: "password123" }), true);

await testMiddleware("signIn missing passWord", authV.validateSignIn,
  mockReq({ email: "test@example.com" }), false);

await testMiddleware("resetPassword valid", authV.validateResetPassword,
  mockReq({ email: "test@example.com", otp: "123456", newPassword: "newpass123" }), true);

await testMiddleware("resetPassword short newPassword", authV.validateResetPassword,
  mockReq({ email: "test@example.com", otp: "123456", newPassword: "abc" }), false);

// ---------------------------------------------------------------------------
// [2] User validator tests
// ---------------------------------------------------------------------------
console.log("\n[user.validator]");

await testMiddleware("createUser valid", userV.validateCreateUser,
  mockReq({ email: "admin@test.com", passWord: "secret123", fullName: "Admin User" }), true);

await testMiddleware("createUser invalid role", userV.validateCreateUser,
  mockReq({ email: "admin@test.com", passWord: "secret123", fullName: "Admin User", role: "superadmin" }), false);

await testMiddleware("updatePassword valid", userV.validateUpdatePassword,
  mockReq({ currentPassword: "oldpass", newPassword: "newpass123" }), true);

await testMiddleware("updatePassword short new", userV.validateUpdatePassword,
  mockReq({ currentPassword: "oldpass", newPassword: "abc" }), false);

await testMiddleware("updateProfile valid", userV.validateUpdateProfile,
  mockReq({ sex: "male", fullName: "New Name" }), true);

await testMiddleware("updateProfile invalid sex", userV.validateUpdateProfile,
  mockReq({ sex: "other" }), false);

await testMiddleware("userIdParam valid", userV.validateUserIdParam,
  mockReq({}, { id: "507f1f77bcf86cd799439011" }), true);

await testMiddleware("userIdParam invalid", userV.validateUserIdParam,
  mockReq({}, { id: "notanobjectid" }), false);

// ---------------------------------------------------------------------------
// [3] Order validator tests
// ---------------------------------------------------------------------------
console.log("\n[order.validator]");

await testMiddleware("updateOrderStatus valid", orderV.validateUpdateOrderStatus,
  mockReq({ status: "confirmed" }), true);

await testMiddleware("updateOrderStatus invalid status", orderV.validateUpdateOrderStatus,
  mockReq({ status: "processing" }), false);

await testMiddleware("updateOrderStatus missing", orderV.validateUpdateOrderStatus,
  mockReq({}), false);

// ---------------------------------------------------------------------------
// [4] Banner validator tests
// ---------------------------------------------------------------------------
console.log("\n[banner.validator]");

const validBanner = {
  title: "Summer Sale",
  imageUrl: "https://example.com/img.jpg",
  position: "top",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
};

await testMiddleware("createBanner valid", bannerV.validateCreateBanner,
  mockReq(validBanner), true);

await testMiddleware("createBanner missing title", bannerV.validateCreateBanner,
  mockReq({ ...validBanner, title: "" }), false);

await testMiddleware("createBanner end < start", bannerV.validateCreateBanner,
  mockReq({ ...validBanner, startDate: "2025-12-31", endDate: "2025-01-01" }), false);

await testMiddleware("createBanner sortOrder coercion '3' → 3", bannerV.validateCreateBanner,
  mockReq({ ...validBanner, sortOrder: "3" }), true);

await testMiddleware("createBanner isActive coercion 'true' → true", bannerV.validateCreateBanner,
  mockReq({ ...validBanner, isActive: "true" }), true);

await testMiddleware("createBanner targetType=product without targetId", bannerV.validateCreateBanner,
  mockReq({ ...validBanner, targetType: "product" }), false);

await testMiddleware("createBanner targetType=product with targetId", bannerV.validateCreateBanner,
  mockReq({ ...validBanner, targetType: "product", targetId: "prod-123" }), true);

await testMiddleware("createBanner targetType=external no targetId needed", bannerV.validateCreateBanner,
  mockReq({ ...validBanner, targetType: "external" }), true);

await testMiddleware("updateBanner valid partial", bannerV.validateUpdateBanner,
  mockReq({ title: "Updated Title" }), true);

await testMiddleware("updateBanner end < start", bannerV.validateUpdateBanner,
  mockReq({ startDate: "2025-12-31", endDate: "2025-01-01" }), false);

// Verify coercion
const coerceReq = mockReq({ ...validBanner, sortOrder: "5", isActive: "false" });
await testMiddleware("createBanner coercion applied", bannerV.validateCreateBanner,
  coerceReq, true);

// ---------------------------------------------------------------------------
// [5] WebsiteSettings validator tests
// ---------------------------------------------------------------------------
console.log("\n[websiteSettings.validator]");

await testMiddleware("updateSettings valid", wsV.validateUpdateSettings,
  mockReq({
    general: { siteName: "MyShop", email: "shop@example.com", hotline: "0901234567", address: "123 Street" },
    system: { maintenanceMode: "false", enableVoucher: "true" }
  }), true);

await testMiddleware("updateSettings missing general", wsV.validateUpdateSettings,
  mockReq({ system: { maintenanceMode: "false" } }), false);

await testMiddleware("updateSettings invalid email in general", wsV.validateUpdateSettings,
  mockReq({
    general: { siteName: "MyShop", email: "notanemail", hotline: "0901234567", address: "123 Street" }
  }), false);

await testMiddleware("updateSettings empty siteName", wsV.validateUpdateSettings,
  mockReq({
    general: { siteName: "", email: "shop@example.com", hotline: "0901234567", address: "123 Street" }
  }), false);

// ---------------------------------------------------------------------------
// [6] Page validator tests
// ---------------------------------------------------------------------------
console.log("\n[page.validator]");

await testMiddleware("validatePage valid", pageV.validatePage,
  mockReq({
    title: "About Us",
    slug: "about-us",
    type: "about",
    sections: [{ type: "hero", data: { title: "Welcome" } }]
  }), true);

await testMiddleware("validatePage missing title", pageV.validatePage,
  mockReq({ slug: "about", type: "about" }), false);

await testMiddleware("validatePage invalid type", pageV.validatePage,
  mockReq({ title: "T", slug: "t", type: "invalid_type" }), false);

await testMiddleware("validatePage invalid section type", pageV.validatePage,
  mockReq({ title: "T", slug: "t", type: "about", sections: [{ type: "nonexistent" }] }), false);

// ---------------------------------------------------------------------------
// [7] PageSection validator tests (utility functions)
// ---------------------------------------------------------------------------
console.log("\n[pageSection.validator]");

testUtility("validateSectionData hero valid", psV.validateSectionData, "hero", { title: "Hello" });
testUtilityThrows("validateSectionData invalid type", psV.validateSectionData, "nonexistent", {});

testUtility("validateSectionsArray valid", psV.validateSectionsArray, [
  { type: "hero", data: { title: "Hello" } },
  { type: "quote", data: { quote: "The best fashion" } },
]);

testUtilityThrows("validateSectionsArray quote missing required", psV.validateSectionData, "quote", {});
testUtilityThrows("validateSectionsArray not array", psV.validateSectionsArray, "notanarray");

// ---------------------------------------------------------------------------
// [8] Communication validator tests (utility functions)
// ---------------------------------------------------------------------------
console.log("\n[communication.validator]");

testUtility("validateCreateConversationDto defaults", commV.validateCreateConversationDto, {
  customerId: "user123"
});

testUtilityThrows("validateCreateConversationDto invalid type", commV.validateCreateConversationDto, {
  customerId: "user123",
  type: "invalid"
});

testUtility("validateCreateMessageDto valid", commV.validateCreateMessageDto, {
  conversationId: "conv123",
  senderType: "user",
  content: "Hello world"
});

testUtilityThrows("validateCreateMessageDto missing senderType", commV.validateCreateMessageDto, {
  content: "Hello"
});

testUtilityThrows("validateCreateMessageDto content too long", commV.validateCreateMessageDto, {
  senderType: "user",
  content: "x".repeat(10001)
});

testUtility("validateTextMessageDto valid", commV.validateTextMessageDto, {
  conversationId: "conv123",
  content: "Hello"
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log("✅ All validators migrated successfully!");
} else {
  console.log(`⚠️  ${failed} test(s) failed — review above.`);
  process.exit(1);
}
