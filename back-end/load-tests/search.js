import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";
const SEARCH_PATH = __ENV.SEARCH_PATH || "/api/products";
const KEYWORDS = ["shirt", "hoodie", "jacket", "jeans", "sneaker"];

export const successRate = new Rate("successRate");
export const errorCounter = new Counter("errorCounter");
export const latencyTrend = new Trend("latencyTrend");
export const throughput = new Counter("search_throughput");

export const options = {
  vus: 50,
  duration: "30s",
  thresholds: {
    successRate: ["rate>0.99"],
    errorCounter: ["count<10"],
    latencyTrend: ["p(95)<700", "p(99)<1200"],
    http_req_failed: ["rate<0.01"],
  },
};

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export default function () {
  group("GET /api/products?keyword=", () => {
    const keyword = randomItem(KEYWORDS);
    const separator = SEARCH_PATH.includes("?") ? "&" : "?";
    const res = http.get(
      `${BASE_URL}${SEARCH_PATH}${separator}keyword=${encodeURIComponent(keyword)}`
    );

    const ok = check(res, {
      "status is exactly 200": (r) => r.status === 200,
    });

    successRate.add(ok);
    latencyTrend.add(res.timings.duration);
    throughput.add(1);

    if (!ok) {
      errorCounter.add(1);
      console.log(
        `GET search failed: keyword=${keyword}, status=${res.status}, duration=${res.timings.duration}ms, body=${res.body}`
      );
    }
  });

  sleep(1);
}
