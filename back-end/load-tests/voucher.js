import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// ===============================
// Environment
// ===============================

const BASE_URL = __ENV.BASE_URL || "http://localhost:5001";

const TOTAL_USERS = Number(__ENV.TOTAL_USERS || 1000);

const PASSWORD = __ENV.TEST_PASSWORD || "Minhhoang123";

// ===============================
// Metrics
// ===============================

export const voucherSuccessRate = new Rate("voucherSuccessRate");

export const voucherErrorCounter = new Counter("voucherErrorCounter");

export const voucherLatency = new Trend("voucherLatency");

// ===============================
// Options
// ===============================

export const options = {
  stages: [
    {
      duration: "30s",
      target: 50,
    },

    {
      duration: "1m",
      target: 50,
    },

    {
      duration: "30s",
      target: 200,
    },

    {
      duration: "1m",
      target: 200,
    },

    {
      duration: "30s",
      target: 0,
    },
  ],

  thresholds: {
    "http_req_duration{endpoint:voucher_validate}": ["p(95)<800"],

    voucherSuccessRate: ["rate>0.98"],

    http_req_failed: ["rate<0.01"],
  },
};

// ===============================
// Token cache
// ===============================

const tokenCache = {};

function getToken() {
  if (tokenCache[__VU]) {
    return tokenCache[__VU];
  }

  const userIndex = ((__VU - 1) % TOTAL_USERS) + 1;

  const email = `loadtest${userIndex}@gmail.com`;

  const res = http.post(
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

  const ok = check(res, {
    "login status 200": (r) => r.status === 200,
  });

  if (!ok) {
    return null;
  }

  const token = res.json("data.accessToken") || res.json("accessToken");

  tokenCache[__VU] = token;

  return token;
}

// ===============================
// Setup get vouchers
// ===============================

export function setup() {
  const res = http.get(`${BASE_URL}/api/vouchers`);

  check(res, {
    "get vouchers success": (r) => r.status === 200,
  });

  let vouchers = [];

  try {
    const body = res.json();

    vouchers = body.data?.vouchers || body.data || body.vouchers || [];
  } catch (e) {
    vouchers = [];
  }

  // chỉ lấy voucher active

  vouchers = vouchers.filter((v) => {
    return v.status === "ACTIVE" || v.isActive === true;
  });

  if (vouchers.length === 0) {
    throw new Error("Không tìm thấy voucher ACTIVE");
  }

  return {
    vouchers,
  };
}

// ===============================
// Main
// ===============================

export default function (data) {
  const token = getToken();

  if (!token) {
    sleep(1);

    return;
  }

  // Select the first active voucher (which is seeded as CLAIMED for all test VUs in _seedUserWalletIfEmpty)
  const voucher = data.vouchers[0];

  /*
        tạo subtotal hợp lệ

        tránh fail vì minOrderValue
    */

  const minValue = voucher.minOrderValue || 0;

  const subtotal = minValue + Math.floor(Math.random() * 500000);

  group("POST /api/vouchers/validate", () => {
    const payload = JSON.stringify({
      code: voucher.code,

      subtotal,

      items: [],

      shippingFee: 0,
    });

    const res = http.post(
      `${BASE_URL}/api/vouchers/validate`,

      payload,

      {
        headers: {
          Authorization: `Bearer ${token}`,

          "Content-Type": "application/json",
        },

        tags: {
          endpoint: "voucher_validate",
        },
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

    voucherSuccessRate.add(success);

    voucherLatency.add(res.timings.duration);

    if (!success) {
      voucherErrorCounter.add(1);

      if (__ENV.DEBUG === "true") {
        console.log(
          `[VOUCHER FAIL] code: ${voucher.code} status: ${res.status} duration: ${res.timings.duration}ms body: ${res.body}`,
        );
      }
    }
  });

  sleep(Math.random() * 2 + 0.5);
}
