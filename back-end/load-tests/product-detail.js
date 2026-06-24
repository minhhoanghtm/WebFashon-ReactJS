import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

// ✅ Dùng slug thay vì _id
const PRODUCT_SLUGS = (
  __ENV.PRODUCT_SLUGS ||
  [
    "ao-khoac-jean",
    "ao-khoac-bomber",
    "ao-khoac-hoodie",
    "ao-khoac-da",
    "ao-polo-basic",
    "ao-polo-soc",
    "ao-polo-slimfit",
    "ao-polo-the-thao",
    "sneaker-trang-basic",
    "sneaker-chunky",
    "sneaker-the-thao",
    "sneaker-co-cao",
    "sneaker-retro",
    "quan-jean-baggy",
    "quan-jean-skinny",
    "quan-jean-rach",
    "quan-jean-xanh-basic",
    "quan-jean-den",
    "quan-cargo",
    "quan-tay-slimfit",
    "quan-jogger-the-thao",
    "quan-short-kaki",
    "ao-da-banh1781695989863",
    "ao-gio1781694935556",
    "ao-the-thao1781694362663",
  ].join(",")
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const successRate = new Rate("successRate");
export const errorCounter = new Counter("errorCounter");
export const latencyTrend = new Trend("latencyTrend");
export const throughput = new Counter("product_detail_throughput");

export const options = {
  vus: 50,
  duration: "30s",
  thresholds: {
    successRate: ["rate>0.99"],
    errorCounter: ["count<10"],
    latencyTrend: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.01"],
  },
};

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export default function () {
  const slug = randomItem(PRODUCT_SLUGS);

  group("GET /api/products/:slug", () => {
    const res = http.get(`${BASE_URL}/api/products/${slug}`);

    const ok = check(res, {
      "status is exactly 200": (r) => r.status === 200,
      "response has product data": (r) => {
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
        `FAILED: slug=${slug}, status=${res.status}, body=${res.body}`
      );
    }
  });

  sleep(1);
}