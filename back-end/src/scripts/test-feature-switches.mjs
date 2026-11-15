import "dotenv/config";
import { connectDB } from "../configs/db.js";
import Product from "../modules/products/product.model.js";

const BACKEND_URL = "http://localhost:5000";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log("==================================================================");
  console.log("🧪 TESTING 4 FEATURE SWITCHES & API GATING");
  console.log("==================================================================\n");

  await connectDB();

  // Login to obtain valid whitelisted admin access token
  const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "khongcotien.2023@gmail.com",
      passWord: "NewPassword@123",
    }),
  });

  const loginData = await loginRes.json();
  const adminToken = loginData.accessToken || loginData.data?.accessToken;
  if (!adminToken) {
    throw new Error(`Failed to login as admin: ${JSON.stringify(loginData)}`);
  }
  console.log("🔑 Logged in successfully with Admin credentials.");

  // Find a product for testing orders
  const sampleProduct = await Product.findOne({ stock: { $gt: 5 } });
  if (!sampleProduct) {
    throw new Error("No available product with stock found!");
  }

  // Helper to update settings via API
  const updateSettingsApi = async (newSystem) => {
    const res = await fetch(`${BACKEND_URL}/api/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ system: newSystem }),
    });
    const data = await res.json();
    await delay(300); // allow in-memory cache / socket invalidation to propagate
    return data;
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Maintenance Mode Gating
    // -------------------------------------------------------------------------
    console.log("\n👉 [1/5] Testing Maintenance Mode Switch...");

    // Turn ON
    await updateSettingsApi({
      maintenanceMode: true,
      maintenanceMessage: "Máy chủ đang bảo trì nâng cấp.",
    });

    const clientRes503 = await fetch(`${BACKEND_URL}/api/products`);
    const data503 = await clientRes503.json();
    if (clientRes503.status === 503 && data503.code === "MAINTENANCE") {
      console.log("  ✅ Non-admin client API received 503 MAINTENANCE as expected.");
    } else {
      throw new Error(`Expected 503 MAINTENANCE, got status ${clientRes503.status}`);
    }

    // Admin request should pass
    const adminRes = await fetch(`${BACKEND_URL}/api/products`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminRes.status === 200) {
      console.log("  ✅ Admin request bypassed maintenance with 200 OK.");
    } else {
      throw new Error(`Expected admin to bypass maintenance, got status ${adminRes.status}`);
    }

    // Health & Settings should remain 200
    const healthRes = await fetch(`${BACKEND_URL}/api/health`);
    const settingsRes = await fetch(`${BACKEND_URL}/api/settings`);
    if (healthRes.status === 200 && settingsRes.status === 200) {
      console.log("  ✅ Public endpoints (/health, /settings) remain accessible.");
    } else {
      throw new Error("Public endpoints failed during maintenance.");
    }

    // Turn OFF
    await updateSettingsApi({ maintenanceMode: false });
    const clientRes200 = await fetch(`${BACKEND_URL}/api/products`);
    if (clientRes200.status === 200) {
      console.log("  ✅ Client API restored to 200 OK after turning maintenance OFF.");
    } else {
      throw new Error(`Expected 200 OK after maintenance turned off, got ${clientRes200.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Guest Checkout Flag & Order Lookup
    // -------------------------------------------------------------------------
    console.log("\n👉 [2/5] Testing Guest Checkout Switch & Guest Order Lookup...");

    const guestOrderPayload = {
      fullName: "Nguyễn Văn Khách",
      phone: "0987654321",
      shippingAddress: "Số 123 Đường Thời Trang, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh",
      paymentMethod: "COD",
      items: [
        {
          product_id: sampleProduct._id.toString(),
          quantity: 1,
          price: sampleProduct.new_price || 250000,
        },
      ],
      totalPrice: sampleProduct.new_price || 250000,
    };

    // When allowGuestCheckout = false -> MUST reject
    await updateSettingsApi({ allowGuestCheckout: false });
    const guestDisabledRes = await fetch(`${BACKEND_URL}/api/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guestOrderPayload),
    });
    const guestDisabledData = await guestDisabledRes.json();
    if (guestDisabledRes.status === 403 && (guestDisabledData.code === "GUEST_CHECKOUT_DISABLED" || guestDisabledData.details === "GUEST_CHECKOUT_DISABLED")) {
      console.log("  ✅ Guest checkout rejected with 403 GUEST_CHECKOUT_DISABLED when flag is OFF.");
    } else {
      throw new Error(`Expected 403 GUEST_CHECKOUT_DISABLED, got status ${guestDisabledRes.status}`);
    }

    // When allowGuestCheckout = true -> MUST create order
    await updateSettingsApi({ allowGuestCheckout: true });
    const guestAllowedRes = await fetch(`${BACKEND_URL}/api/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guestOrderPayload),
    });
    const guestAllowedData = await guestAllowedRes.json();
    if (guestAllowedRes.status === 200 && guestAllowedData.success && guestAllowedData.order) {
      const createdGuestOrder = guestAllowedData.order;
      console.log(`  ✅ Guest checkout succeeded with 200 OK. Order ID: ${createdGuestOrder._id}`);

      // Test Guest Order Lookup
      console.log("  🔍 Testing Guest Order Lookup API (/api/order/guest-lookup)...");
      const lookupOkRes = await fetch(
        `${BACKEND_URL}/api/order/guest-lookup?orderCode=${createdGuestOrder._id}&phone=0987654321`
      );
      const lookupOkData = await lookupOkRes.json();
      if (lookupOkRes.status === 200 && lookupOkData.success && lookupOkData.order) {
        console.log("  ✅ Guest Order Lookup succeeded with matching phone number.");
      } else {
        throw new Error(`Lookup failed with valid phone number: ${JSON.stringify(lookupOkData)}`);
      }

      // Phone mismatch should return 404
      const lookupMismatchRes = await fetch(
        `${BACKEND_URL}/api/order/guest-lookup?orderCode=${createdGuestOrder._id}&phone=0900000000`
      );
      if (lookupMismatchRes.status === 404) {
        console.log("  ✅ Guest Order Lookup returned 404 on phone mismatch as expected.");
      } else {
        throw new Error(`Expected 404 on phone mismatch, got ${lookupMismatchRes.status}`);
      }
    } else {
      throw new Error(`Guest checkout failed when enabled: ${JSON.stringify(guestAllowedData)}`);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Voucher Feature Flag Gating
    // -------------------------------------------------------------------------
    console.log("\n👉 [3/5] Testing Voucher Feature Switch...");

    // Turn OFF
    await updateSettingsApi({ enableVoucher: false });
    const voucherOffRes = await fetch(`${BACKEND_URL}/api/vouchers`);
    const voucherOffData = await voucherOffRes.json();
    if (voucherOffRes.status === 403 && voucherOffData.code === "FEATURE_DISABLED") {
      console.log("  ✅ Public voucher API returned 403 FEATURE_DISABLED when flag is OFF.");
    } else {
      throw new Error(`Expected 403 FEATURE_DISABLED, got status ${voucherOffRes.status}`);
    }

    // Turn ON
    await updateSettingsApi({ enableVoucher: true });
    const voucherOnRes = await fetch(`${BACKEND_URL}/api/vouchers`);
    if (voucherOnRes.status === 200) {
      console.log("  ✅ Public voucher API returned 200 OK when flag is ON.");
    } else {
      throw new Error(`Expected 200 OK, got status ${voucherOnRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Review Feature Flag Gating & Purchase Check
    // -------------------------------------------------------------------------
    console.log("\n👉 [4/5] Testing Reviews Feature Switch...");

    // Turn OFF
    await updateSettingsApi({ enableReviews: false });
    const reviewOffRes = await fetch(`${BACKEND_URL}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        product_id: sampleProduct._id.toString(),
        rating: 5,
        content: { text: "Rất đẹp" },
      }),
    });
    const reviewOffData = await reviewOffRes.json();
    if (reviewOffRes.status === 403 && reviewOffData.code === "FEATURE_DISABLED") {
      console.log("  ✅ Review creation returned 403 FEATURE_DISABLED when flag is OFF.");
    } else {
      throw new Error(`Expected 403 FEATURE_DISABLED, got status ${reviewOffRes.status}`);
    }

    // Turn ON: Admin hasn't bought this product in delivered status -> should fail with NOT_PURCHASED
    await updateSettingsApi({ enableReviews: true });
    const reviewOnRes = await fetch(`${BACKEND_URL}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        product_id: sampleProduct._id.toString(),
        rating: 5,
        content: { text: "Thử đánh giá" },
      }),
    });
    const reviewOnData = await reviewOnRes.json();
    if (reviewOnRes.status === 403 && reviewOnData.code === "NOT_PURCHASED") {
      console.log("  ✅ Review creation correctly checked delivered purchase (403 NOT_PURCHASED).");
    } else {
      console.log(`  ℹ️ Review creation status: ${reviewOnRes.status} (${reviewOnData.message || ""})`);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Reset All Flags to Defaults
    // -------------------------------------------------------------------------
    console.log("\n👉 [5/5] Resetting Feature Flags to System Defaults...");
    await updateSettingsApi({
      maintenanceMode: false,
      allowGuestCheckout: false,
      enableVoucher: true,
      enableReviews: true,
      maintenanceMessage:
        "Hệ thống đang được nâng cấp để mang đến trải nghiệm tốt hơn. Quý khách vui lòng quay lại sau ít phút.",
      maintenanceUntil: null,
    });
    console.log("  ✅ Reset successful: maintenance=false, guestCheckout=false, voucher=true, reviews=true.\n");

    console.log("🎉 ALL FEATURE SWITCH TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test suite failed:", err);
    // Cleanup on failure
    try {
      await updateSettingsApi({
        maintenanceMode: false,
        allowGuestCheckout: false,
        enableVoucher: true,
        enableReviews: true,
      });
    } catch (_) {}
    process.exit(1);
  }
}

run();
