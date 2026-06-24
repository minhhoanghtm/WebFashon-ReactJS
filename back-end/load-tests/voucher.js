import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";
const VOUCHER_CODE = __ENV.VOUCHER_CODE || "HELLO"; // minOrderValue=100000
const SUBTOTAL = Number(__ENV.SUBTOTAL || 200000); // minOrderValue=100000

export const successRate = new Rate("successRate");
export const errorCounter = new Counter("errorCounter");
export const latencyTrend = new Trend("latencyTrend");
export const throughput = new Counter("voucher_apply_throughput");

export const options = {
  vus: 30,
  duration: "30s",
  thresholds: {
    successRate: ["rate>0.98"],
    errorCounter: ["count<20"],
    latencyTrend: ["p(95)<700", "p(99)<1200"],
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

  // token nằm trong data.accessToken
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

  group("POST /api/vouchers/validate", () => {
    const payload = JSON.stringify({
      code: VOUCHER_CODE,       // ✅ "code" theo controller
      subtotal: SUBTOTAL,       // ✅ "subtotal" theo controller
      items: [],                // optional nhưng truyền để tránh undefined
      shippingFee: 0,           // optional
    });

    const res = http.post(
      `${BASE_URL}/api/vouchers/validate`,
      payload,
      params
    );

    const ok = check(res, {
      "status is exactly 200": (r) => r.status === 200,
      "voucher response is successful": (r) => {
        try {
          return r.json("success") === true;
        } catch (_) {
          return false;
        }
      },
    });

    successRate.add(ok);
    latencyTrend.add(res.timings.duration);
    throughput.add(1);

    if (!ok) {
      errorCounter.add(1);
      console.log(`FAILED: status=${res.status}, body=${res.body}`);
    }
  });

  sleep(1);
}