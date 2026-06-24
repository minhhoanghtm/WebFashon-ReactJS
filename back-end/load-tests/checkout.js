import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import { SharedArray } from "k6/data";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

// ✅ Slugs thật từ DB
const PRODUCT_SLUGS = [
  "ao-khoac-bomber",
  "ao-khoac-hoodie",
  "ao-khoac-da",
  "ao-polo-basic",
  "ao-polo-soc",
  "ao-polo-slimfit",
  "sneaker-trang-basic",
  "sneaker-chunky",
  "sneaker-the-thao",
  "quan-jean-baggy",
  "quan-cargo",
  "quan-jogger-the-thao",
];

// ✅ Pool tài khoản test — cần tạo sẵn ít nhất 30 user trong DB
// Hoặc truyền qua ENV: K6_TEST_ACCOUNTS='[{"email":"...","passWord":"..."}]'
const TEST_ACCOUNTS = new SharedArray("accounts", () => {
  if (__ENV.TEST_ACCOUNTS) {
    return JSON.parse(__ENV.TEST_ACCOUNTS);
  }
  // Fallback: generate danh sách mặc định testuser1..testuser30
  return Array.from({ length: 30 }, (_, i) => ({
    email: "khongcotien.2023@gmail.com",
    passWord: "Minhhoang123",
  }));
});

export const successRate = new Rate("successRate");
export const errorCounter = new Counter("errorCounter");
export const latencyTrend = new Trend("latencyTrend");
export const throughput = new Counter("checkout_flow_throughput");

export const options = {
  vus: 30,
  duration: "1m",
  thresholds: {
    successRate: ["rate>0.97"],
    errorCounter: ["count<30"],
    latencyTrend: ["p(95)<1200", "p(99)<2500"],
    http_req_failed: ["rate<0.03"],
  },
};

// ✅ setup() không còn login nữa — chỉ dùng để warmup nếu cần
export function setup() {
  return {};
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function record(res, ok, label) {
  successRate.add(ok);
  latencyTrend.add(res.timings.duration);
  throughput.add(1);
  if (!ok) {
    errorCounter.add(1);
    console.log(`${label} failed: status=${res.status}, body=${res.body}`);
  }
}

// ✅ Cache token theo VU để tránh login lại mỗi iteration
const vuTokenCache = {};

function getToken() {
  // Nếu VU này đã có token thì tái dùng
  if (vuTokenCache[__VU]) {
    return vuTokenCache[__VU];
  }

  // Mỗi VU chọn account riêng theo index (__VU bắt đầu từ 1)
  const account = TEST_ACCOUNTS[(__VU - 1) % TEST_ACCOUNTS.length];

  const loginRes = http.post(
    `${BASE_URL}/api/auth/signIn`,
    JSON.stringify(account),
    { headers: { "Content-Type": "application/json" } },
  );

  const token = loginRes.json("data.accessToken");

  if (!token) {
    console.log(
      `VU ${__VU} login failed for ${account.email}: ${loginRes.body}`,
    );
    errorCounter.add(1);
    return null;
  }

  console.log(
    `VU ${__VU} logged in as ${account.email}, token: ${token.substring(0, 20)}...`,
  );
  vuTokenCache[__VU] = token;
  return token;
}

export default function () {
  // ✅ Lấy token riêng cho từng VU
  const token = getToken();
  if (!token) {
    sleep(1);
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const slug = randomItem(PRODUCT_SLUGS);

  // Step 1: GET danh sách sản phẩm
  group("1. GET /api/products", () => {
    const res = http.get(`${BASE_URL}/api/products`);
    const ok = check(res, {
      "products status is exactly 200": (r) => r.status === 200,
    });
    record(res, ok, "GET /api/products");
  });

  // Step 2: GET chi tiết sản phẩm bằng slug → lấy _id và price
  let productId = null;
  let productPrice = null;

  group("2. GET /api/products/:slug", () => {
    const res = http.get(`${BASE_URL}/api/products/${slug}`);
    const ok = check(res, {
      "product detail status is exactly 200": (r) => r.status === 200,
    });
    record(res, ok, `GET /api/products/${slug}`);

    if (ok) {
      try {
        productId = res.json("data._id");
        productPrice = res.json("data.new_price");
      } catch (_) {}
    }
  });

  // Step 3: POST thêm vào giỏ hàng
  group("3. POST /api/cart_items", () => {
    if (!productId) {
      errorCounter.add(1);
      return;
    }

    const payload = JSON.stringify({
      product_id: productId,
      variant_id: null,
      quantity: 1,
      price: productPrice || 100000,
    });

    const res = http.post(`${BASE_URL}/api/cart_items`, payload, { headers });
    const ok = check(res, {
      "cart status is exactly 200": (r) => r.status === 200,
      "cart response successful": (r) => {
        try {
          return r.json("success") === true;
        } catch (_) {
          return false;
        }
      },
    });
    record(res, ok, "POST /api/cart_items");
  });

  // Step 4: POST tạo đơn hàng
  group("4. POST /api/order", () => {
    const payload = JSON.stringify({
      shippingAddress: {
        full_name: "Nguyễn Văn Nam",
        phone: "0912345678",
        city: "Đồng Nai",
        district: "Thành phố Biên Hòa",
        ward: "Phường Hố Nai",
        address_detail: "25 Nguyễn Văn Nghi",
      },
      paymentMethod: "COD",
      items: [],
      totalPrice: 500000,
    });

    const res = http.post(`${BASE_URL}/api/order`, payload, { headers });
    const ok = check(res, {
      "order status is exactly 200": (r) => r.status === 200,
      "order response successful": (r) => {
        try {
          return r.json("success") === true;
        } catch (_) {
          return false;
        }
      },
    });
    record(res, ok, "POST /api/order");
  });

  sleep(1);
}