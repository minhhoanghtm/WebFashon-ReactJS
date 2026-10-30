import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5001";

const TOTAL_USERS = Number(__ENV.TOTAL_USERS || 1000);
const PASSWORD = __ENV.TEST_PASSWORD || "Minhhoang123";
const PAYMENT_METHOD = __ENV.PAYMENT_METHOD || "COD";

export const orderSuccessRate = new Rate("orderSuccessRate");
export const orderErrorCounter = new Counter("orderErrorCounter");
export const orderBusinessErrorCounter = new Counter(
  "orderBusinessErrorCounter",
);
export const orderLatency = new Trend("orderLatency");

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 200 },
    { duration: "1m", target: 200 },
    { duration: "30s", target: 0 },
  ],

  thresholds: {
    "http_req_duration{endpoint:create_order}": ["p(95)<1000"],
    orderSuccessRate: ["rate>0.98"],
    http_req_failed: ["rate<0.01"],
  },
};

const tokenCache = {};

function getToken() {
  if (tokenCache[__VU]) {
    return tokenCache[__VU];
  }

  const email = `loadtest${((__VU - 1) % TOTAL_USERS) + 1}@gmail.com`;

  const loginRes = http.post(
    `${BASE_URL}/api/auth/signIn`,
    JSON.stringify({
      email,
      passWord: PASSWORD,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },

      tags: {
        endpoint: "signin",
      },
    },
  );

  const ok = check(loginRes, {
    "login success": (r) => r.status === 200,
  });

  if (!ok) {
    console.log(`[LOGIN] ${email}`);
    console.log(loginRes.body);
    return null;
  }

  const token = loginRes.json("data.accessToken");

  tokenCache[__VU] = token;

  return token;
}

export default function () {
  const token = getToken();

  if (!token) {
    sleep(1);
    return;
  }

  group("POST /api/order", () => {
    const payload = JSON.stringify({
      shippingAddress: {
        full_name: "Nguyễn Văn Nam",
        phone: "0912345678",
        city: "Đồng Nai",
        district: "Biên Hòa",
        ward: "Hố Nai",
        address_detail: "25 Nguyễn Văn Nghi",
      },
      paymentMethod: PAYMENT_METHOD,
    });

    const res = http.post(`${BASE_URL}/api/order`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      tags: {
        endpoint: "create_order",
      },
    });

    const ok = check(res, {
      "status 200": (r) => r.status === 200,
      "success=true": (r) => {
        try {
          return r.json("success") === true;
        } catch {
          return false;
        }
      },
    });

    orderSuccessRate.add(ok);
    orderLatency.add(res.timings.duration);

    if (res.status === 200) {
      try {
        if (!res.json("success")) {
          orderBusinessErrorCounter.add(1);
        }
      } catch {}
    }

    if (!ok && __ENV.DEBUG === "true") {
      console.log(
        `[ORDER] status=${res.status} duration=${res.timings.duration} body=${res.body}`,
      );
    }
  });

  sleep(Math.random() * 2 + 0.5);
}
