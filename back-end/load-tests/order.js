import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";
const ORDER_PATH = __ENV.ORDER_PATH || "/api/order";
const PAYMENT_METHOD = __ENV.PAYMENT_METHOD || "COD";

export const successRate = new Rate("successRate");
export const errorCounter = new Counter("errorCounter");
export const businessErrorCounter = new Counter("business_error_count");
export const latencyTrend = new Trend("latencyTrend");
export const throughput = new Counter("order_create_throughput");

export const options = {
  vus: 50,
  duration: "30s",
  thresholds: {
    successRate: ["rate>0.98"],
    errorCounter: ["count<20"],
    business_error_count: ["count<10"],
    latencyTrend: ["p(95)<1000", "p(99)<2000"],
    http_req_failed: ["rate<0.02"],
  },
};

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/signIn`,
    JSON.stringify({
      email: __ENV.TEST_EMAIL || "khongcotien.2023@gmail.com",
      passWord: __ENV.TEST_PASSWORD || "Minhhoang123",
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  console.log(`Login status: ${loginRes.status}`);
  const token = loginRes.json("data.accessToken");
  if (!token) throw new Error(`Login failed: ${loginRes.body}`);
  console.log(`Token acquired: ${token.substring(0, 20)}...`);
  return { token };
}

export default function (data) {
  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.token}`,
    },
  };

  group("POST /api/order", () => {
    // ✅ shippingAddress là object theo đúng createOrder.command.js
    const payload = JSON.stringify({
      shippingAddress: {
        full_name: "Nguyễn Văn Nam",
        phone: "0912345678",
        city: "Đồng Nai",
        district: "Thành phố Biên Hòa",
        ward: "Phường Hố Nai",
        address_detail: "25 Nguyễn Văn Nghi",
      },
      paymentMethod: PAYMENT_METHOD,
      items: [],        // không có items → dùng totalPrice
      totalPrice: 500000,
    });

    const res = http.post(`${BASE_URL}${ORDER_PATH}`, payload, params);

    const ok = check(res, {
      "status is exactly 200": (r) => r.status === 200,
      "order created successfully": (r) => {
        try {
          return r.json("success") === true;
        } catch (_) {
          return false;
        }
      },
      "response time is under 1000ms": (r) => r.timings.duration < 1000,
    });

    let businessError = false;
    try {
      businessError = res.status === 200 && res.json("success") !== true;
    } catch (_) {
      businessError = res.status === 200;
    }

    successRate.add(ok);
    latencyTrend.add(res.timings.duration);
    throughput.add(1);

    if (businessError) businessErrorCounter.add(1);

    if (!ok) {
      errorCounter.add(1);
      console.log(
        `FAILED: status=${res.status}, duration=${res.timings.duration}ms, body=${res.body}`
      );
    }
  });

  sleep(1);
}