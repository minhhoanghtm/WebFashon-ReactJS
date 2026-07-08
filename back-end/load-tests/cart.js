import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5001";
const TOTAL_USERS = Number(__ENV.TOTAL_USERS || 1000);
const PASSWORD = __ENV.TEST_PASSWORD || "Minhhoang123";

// Custom metrics
export const cartAddSuccessRate = new Rate("cartAddSuccessRate");
export const cartAddErrorCounter = new Counter("cartAddErrorCounter");
export const cartAddLatency = new Trend("cartAddLatency");

// Token cache per VU
const tokenCache = {};

// Test config
export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 200 },
    { duration: "1m", target: 200 },
    { duration: "30s", target: 0 },
  ],

  thresholds: {
    // chỉ quan tâm API business chính
    "http_req_duration{endpoint:cart_add}": ["p(95) < 1500"],
    cartAddSuccessRate: ["rate>0.98"],
    http_req_failed: ["rate<0.01"],
  },
};

// Setup data
export function setup() {
  const res = http.get(`${BASE_URL}/api/products?page=1&limit=1000`);
  check(res, {
    "get products success": (r) => r.status === 200,
  });

  let products = [];
  try {
    const body = res.json();
    products = body.data?.products || body.data || body.products || [];
  } catch (e) {
    products = [];
  }
  products = products.filter((p) => p.variants && p.variants.length > 0);
  if (products.length === 0) {
    throw new Error("Không lấy được product để test");
  }

  return {
    products,
  };
}

// Login once per VU
function getToken(email) {
  if (tokenCache[__VU]) {
    return tokenCache[__VU];
  }

  const loginRes = http.post(
    `${BASE_URL}/api/auth/signIn`,
    JSON.stringify({
      email,
      passWord: PASSWORD,
    }),

    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "signin" },
    },
  );

  const loginOK = check(loginRes, {
    "login status 200": (r) => r.status === 200,
  });

  if (!loginOK) {
    if (__ENV.DEBUG === "true") {
      console.log(
        `[LOGIN FAIL] ${email}
        ${loginRes.status}
        ${loginRes.body}`,
      );
    }

    return null;
  }

  const token =
    loginRes.json("data.accessToken") || loginRes.json("accessToken");

  if (!token) {
    if (__ENV.DEBUG === "true") {
      console.log(`[NO TOKEN] ${email}`);
    }

    return null;
  }
  tokenCache[__VU] = token;

  return token;
}

// Main scenario
export default function (data) {
  // mỗi VU dùng 1 account

  const userIndex = ((__VU - 1) % TOTAL_USERS) + 1;
  const email = `loadtest${userIndex}@gmail.com`;
  const token = getToken(email);
  if (!token) {
    return;
  }
  // random product
  const product =
    data.products[Math.floor(Math.random() * data.products.length)];

  // random variant
  const variant =
    product.variants[Math.floor(Math.random() * product.variants.length)];

  // random quantity
  const quantity = Math.floor(Math.random() * 3) + 1;

  group("POST /api/cart_items", () => {
    const payload = JSON.stringify({
      product_id: product._id,
      variant_id: variant._id,
      quantity,
      price: variant.price ?? product.new_price,
    });

    const res = http.post(
      `${BASE_URL}/api/cart_items`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        tags: { endpoint: "cart_add" },
      },
    );

    const success = check(res, {
      "status 200": (r) => r.status === 200,
      "success true": (r) => {
        try {
          return r.json("success") === true;
        } catch (e) {
          return false;
        }
      },
    });

    cartAddSuccessRate.add(success);

    cartAddLatency.add(res.timings.duration);

    if (!success) {
      cartAddErrorCounter.add(1);

      if (__ENV.DEBUG === "true") {
        console.log(
          `[CART FAIL]
            ${email}
            status:${res.status}
            duration:${res.timings.duration}ms`,
        );

        console.log(res.body);
      }
    }
  });

  sleep(1);
}
