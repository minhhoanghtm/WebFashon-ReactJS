import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5001";

const TOTAL_USERS = Number(__ENV.TOTAL_USERS || 1000);
const PASSWORD = __ENV.TEST_PASSWORD || "Minhhoang123";

export const cartAddSuccessRate = new Rate("cartAddSuccessRate");
export const cartAddErrorCounter = new Counter("cartAddErrorCounter");
export const cartAddLatency = new Trend("cartAddLatency");
export const cartAddThroughput = new Counter("cartAddThroughput");

export const options = {
    stages: [
        { duration: "30s", target: 50 },
        { duration: "1m", target: 50 },
        { duration: "30s", target: 200 },
        { duration: "1m", target: 200 },
        { duration: "30s", target: 0 },
    ],

    thresholds: {
        "http_req_duration{endpoint:cart_add}": ["p(95)<1500"],
        cartAddSuccessRate: ["rate>0.98"],
        http_req_failed: ["rate<0.01"],
    },
};

// Cache token theo từng Virtual User
const tokenCache = {};

export function setup() {
    const res = http.get(`${BASE_URL}/api/products`);

    check(res, {
        "Get products success": (r) => r.status === 200,
    });

    const products = res.json("data");

    if (!products || products.length === 0) {
        throw new Error("Không có sản phẩm để test.");
    }

    return {
        products,
    };
}

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
        }
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

export default function (data) {
    const token = getToken();

    if (!token) {
        sleep(1);
        return;
    }

    const product =
        data.products[Math.floor(Math.random() * data.products.length)];

    const variant =
        product.variants && product.variants.length > 0
            ? product.variants[
                  Math.floor(Math.random() * product.variants.length)
              ]
            : null;

    group("POST /api/cart_items", () => {
        const payload = JSON.stringify({
            product_id: product._id,
            variant_id: variant ? variant._id : null,
            quantity: Math.floor(Math.random() * 3) + 1,
            price: product.new_price,
        });

        const res = http.post(
            `${BASE_URL}/api/cart_items`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                tags: {
                    endpoint: "cart_add",
                },
            }
        );

        const ok = check(res, {
            "status is 200": (r) => r.status === 200,
            "success=true": (r) => r.json("success") === true,
        });

        cartAddSuccessRate.add(ok);
        cartAddLatency.add(res.timings.duration);
        cartAddThroughput.add(1);

        if (!ok) {
            cartAddErrorCounter.add(1);

            console.log(
                `[CART] status=${res.status} duration=${res.timings.duration}ms`
            );
            console.log(res.body);
        }
    });

    sleep(Math.random() * 2 + 0.5);
}