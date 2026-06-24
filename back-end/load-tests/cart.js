import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";
const TOKEN = __ENV.TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWVkZTIxYjE3Yzc1MDRhZjhiMGFkZjEiLCJqdGkiOiI2OTJhZmFmMC00YzEyLTRmODQtYWI3Mi02YTVmMTA5MGE2OWYiLCJpYXQiOjE3ODIyOTc5ODgsImV4cCI6MTc4MjI5OTc4OH0.qGbbTnTgdVmoTd_x82C77qgmvk8HEkhrDmqaV4Clkec";
const CART_ITEM_PATH = __ENV.CART_ITEM_PATH || "/api/cart_items";
const PRODUCT_ID = __ENV.PRODUCT_ID || "6a3285f5be256be5df18d773";
const VARIANT_ID = __ENV.VARIANT_ID || "6a33c027ff6e077d1871da49";
const PRICE = Number(__ENV.PRICE || 100000);
export const successRate = new Rate("successRate");
export const errorCounter = new Counter("errorCounter");
export const latencyTrend = new Trend("latencyTrend");
export const throughput = new Counter("cart_add_throughput");

export const options = {
  vus: 30,
  duration: "30s",
  thresholds: {
    successRate: ["rate>0.98"],
    errorCounter: ["count<20"],
    latencyTrend: ["p(95)<800", "p(99)<1500"],
    http_req_failed: ["rate<0.02"],
  },
};

export default function () {
  group("POST /api/cart/items", () => {
    const payload = JSON.stringify({
      productId: PRODUCT_ID,
      variantId: VARIANT_ID,
      product_id: PRODUCT_ID,
      variant_id: VARIANT_ID,
      quantity: 1,
      price: PRICE,
    });

    const params = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
    };

    const res = http.post(`${BASE_URL}${CART_ITEM_PATH}`, payload, params);

    const ok = check(res, {
      "status is exactly 200": (r) => r.status === 200,
      "cart item added successfully": (r) => {
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
      console.log(
        `POST ${CART_ITEM_PATH} failed: status=${res.status}, duration=${res.timings.duration}ms, body=${res.body}`
      );
    }
  });

  sleep(1);
}
