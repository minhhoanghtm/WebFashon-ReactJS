import mongoose from 'mongoose';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { requireEnv } from './require-env.js';

const API_URL = 'http://localhost:5050/api';
const REDIS_URL = requireEnv('REDIS_URL');
const MONGO_URI = requireEnv('MONGO_CONNECTIONSTRING');
const JWT_SECRET = requireEnv('JWT_SECRET');
const customerPassword = requireEnv('STAGING_CUSTOMER_PASSWORD');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

async function run() {
  console.log('================================================================');
  console.log('AUTH REFRESH & AI CHAT RESILIENCE INTEGRATION TEST SUITE');
  console.log('Real Databases: Staging MongoDB (27018) + Staging Redis (6381)');
  console.log('================================================================\n');

  const redis = new Redis(REDIS_URL);
  await mongoose.connect(MONGO_URI);

  // -------------------------------------------------------------------------
  // TEST 1: Customer Login and Cookie Inspection
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Standard Customer Login & Refresh Token Issuance ---');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@404studio.vn', passWord: customerPassword })
  });

  assert(loginRes.status === 200, 'Login HTTP status is 200');
  const loginData = await loginRes.json();
  assert(loginData.success === true, 'Login response success is true');
  assert(!!loginData.data?.accessToken, 'Access token is returned in response body');
  assert(!!loginData.data?.refreshToken, 'Refresh token is returned in response body as fallback');

  const setCookie = loginRes.headers.get('set-cookie');
  assert(!!setCookie && setCookie.includes('refreshToken='), 'HttpOnly refreshToken cookie is set by server');

  const initialAccessToken = loginData.data.accessToken;
  const initialRefreshToken = loginData.data.refreshToken;

  // -------------------------------------------------------------------------
  // TEST 2: Single Refresh Token Rotation
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Single Refresh Token Rotation ---');
  const refreshRes1 = await fetch(`${API_URL}/auth/refreshToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': setCookie
    }
  });

  assert(refreshRes1.status === 200, 'First refresh returns HTTP 200');
  const refreshData1 = await refreshRes1.json();
  assert(refreshData1.success === true, 'First refresh success is true');
  assert(!!refreshData1.data?.accessToken, 'New access token issued');
  assert(refreshData1.data?.accessToken !== initialAccessToken, 'Access token was rotated');

  const rotatedCookie = refreshRes1.headers.get('set-cookie');
  assert(!!rotatedCookie && rotatedCookie !== setCookie, 'New rotated refresh cookie issued');

  // -------------------------------------------------------------------------
  // TEST 3: Concurrent Token Refresh with Grace Period (Multi-Tab / Race Condition)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Concurrent Refresh with Grace Period (Race Condition Simulation) ---');
  // Send 5 concurrent refresh requests using the exact same old cookie
  const concurrentPromises = Array.from({ length: 5 }).map(async (_, idx) => {
    const res = await fetch(`${API_URL}/auth/refreshToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': setCookie // intentionally reusing the old cookie
      }
    });
    const json = await res.json();
    return { idx, status: res.status, success: json.success, hasToken: !!json.data?.accessToken };
  });

  const concurrentResults = await Promise.all(concurrentPromises);
  const allConcurrentSucceeded = concurrentResults.every(r => r.status === 200 && r.success && r.hasToken);
  assert(allConcurrentSucceeded, 'All 5 concurrent requests with rotated token succeeded via 30s Grace Period');

  // -------------------------------------------------------------------------
  // TEST 4: Body-based Refresh Token Fallback (for environments where cookies fail)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Body-based Refresh Token Fallback ---');
  const latestRefreshToken = refreshData1.data.refreshToken;
  const bodyRefreshRes = await fetch(`${API_URL}/auth/refreshToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: latestRefreshToken })
  });

  assert(bodyRefreshRes.status === 200, 'Body-based refresh returns HTTP 200');
  const bodyRefreshData = await bodyRefreshRes.json();
  assert(bodyRefreshData.success === true, 'Body-based refresh returned valid access token');

  // -------------------------------------------------------------------------
  // TEST 5: Expired Token Whitelist Rejection in Redis
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Redis Whitelist & Expired Token Enforcement ---');
  const fakeJti = crypto.randomUUID();
  const fakeExpiredToken = jwt.sign(
    { userId: loginData.data.userId, role: 'user', jti: fakeJti },
    JWT_SECRET,
    { expiresIn: '1s' }
  );
  // Wait 1.5s for JWT to expire
  await new Promise(r => setTimeout(r, 1500));

  const expiredTestRes = await fetch(`${API_URL}/user/me`, {
    headers: { 'Authorization': `Bearer ${fakeExpiredToken}` }
  });
  assert(expiredTestRes.status === 401, 'Expired access token correctly rejected with HTTP 401');

  // Non-whitelisted JTI test (valid JWT signature but missing from Redis whitelist at:jti)
  const nonWhitelistedJti = crypto.randomUUID();
  const nonWhitelistedToken = jwt.sign(
    { userId: loginData.data.userId, role: 'user', jti: nonWhitelistedJti },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const nonWhitelistedRes = await fetch(`${API_URL}/user/me`, {
    headers: { 'Authorization': `Bearer ${nonWhitelistedToken}` }
  });
  assert(nonWhitelistedRes.status === 401, 'Non-whitelisted JTI correctly rejected with HTTP 401');

  // -------------------------------------------------------------------------
  // TEST 6: Multi-turn AI Chat Stability (5 sequential turns)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: Multi-turn AI Chat Stability (5 Sequential Turns) ---');
  const currentToken = bodyRefreshData.data.accessToken;
  const turns = [
    'Chào bạn, 404Studio có những mẫu áo thun nào?',
    'Cho mình xem mẫu đầm hoa nhí đi biển',
    'Chất liệu của đầm này là gì?',
    'Có được đổi trả nếu mặc không vừa không?',
    'Cảm ơn bạn nhé'
  ];

  let chatSucceeded = true;
  let lastConversationId = null;

  for (const turn of turns) {
    const chatRes = await fetch(`${API_URL}/chat/ai/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        content: turn,
        conversationId: lastConversationId || undefined
      })
    });

    if (chatRes.status !== 201) {
      chatSucceeded = false;
      console.error(`Turn "${turn}" failed with status ${chatRes.status}`);
      break;
    }
    const chatJson = await chatRes.json();
    if (chatJson.data?.conversationId) {
      lastConversationId = chatJson.data.conversationId;
    }
  }

  assert(chatSucceeded, 'All 5 sequential AI chat turns completed with HTTP 201 without errors');

  // -------------------------------------------------------------------------
  // TEST 7: AI Chat Client Abort Mid-Flight (Connection Lifecycle)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: AI Chat Abrupt Client Disconnect & Stream Hardening ---');
  const abortController = new AbortController();
  setTimeout(() => abortController.abort(), 1200);

  let caughtAbort = false;
  try {
    await fetch(`${API_URL}/chat/ai/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ content: 'Tìm kiếm tất cả áo blazer cao cấp' }),
      signal: abortController.signal
    });
  } catch (err) {
    caughtAbort = true;
  }

  assert(caughtAbort, 'Client connection aborted mid-flight as simulated');
  // Verify backend process is completely healthy after client disconnect
  await new Promise(r => setTimeout(r, 4000));
  const healthCheck = await fetch(`${API_URL}/health`);
  assert(healthCheck.status === 200, 'Backend is healthy and responsive after client disconnect');

  // -------------------------------------------------------------------------
  // TEST 8: Pending Action Superseding Under Rapid Shopping Intents
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 8: Pending Action Superseding (No 429/500 Spills) ---');
  const shoppingPrompts = [
    'Thêm đầm maxi vào giỏ hàng',
    'Thanh toán đầm maxi hoa nhí',
    'Thêm áo thun vào giỏ hàng',
    'Đặt hàng áo sơ mi trắng',
    'Thanh toán giúp tôi áo khoác'
  ];

  let shoppingTurnsPassed = true;
  for (const p of shoppingPrompts) {
    const sRes = await fetch(`${API_URL}/chat/ai/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ content: p, conversationId: lastConversationId })
    });
    if (sRes.status !== 201) {
      shoppingTurnsPassed = false;
      console.error(`Shopping prompt "${p}" failed with status ${sRes.status}`);
      break;
    }
  }

  assert(shoppingTurnsPassed, 'Multiple rapid shopping intents superseded cleanly without 429 or 500 errors');

  // Cleanup
  await redis.quit();
  await mongoose.disconnect();

  console.log('\n================================================================');
  console.log(`INTEGRATION SUITE COMPLETE: ${passedTests}/${totalTests} CHECKS PASSED (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
