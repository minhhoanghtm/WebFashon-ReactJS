import mongoose from 'mongoose';
import { requireEnv } from './require-env.js';

const customerPassword = requireEnv('STAGING_CUSTOMER_PASSWORD');

async function run() {
  const loginRes = await fetch('http://localhost:5050/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@404studio.vn', passWord: customerPassword })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;

  console.log('--- STARTING 10 CONCURRENT AI CHAT REQUESTS ---');
  const prompts = [
    'Tư vấn cho tôi đầm dạ hội',
    'Có chân váy chữ A không?',
    'Tìm áo sơ mi trắng công sở',
    'Tư vấn size áo cho người 60kg',
    'Có đầm maxi đi biển màu vàng không?',
    'Chính sách bảo hành đổi trả thế nào?',
    'Tìm áo khoác blazer nữ',
    'Gợi ý set đồ đi du lịch hè',
    'Có voucher giảm giá nào không?',
    'Tìm áo thun cotton oversize'
  ];

  const t0 = Date.now();
  const promises = prompts.map(async (prompt, idx) => {
    try {
      const res = await fetch('http://localhost:5050/api/chat/ai/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ content: prompt })
      });
      const data = await res.json();
      return { idx, status: res.status, success: data.success, messagePreview: String(data.message || data.data?.aiMessage?.content || '').slice(0, 50) };
    } catch (err) {
      return { idx, error: err.message };
    }
  });

  const results = await Promise.all(promises);
  const t1 = Date.now();
  console.log(`Finished in ${t1 - t0}ms. Results:`);
  console.table(results);

  // Check health
  const healthRes = await fetch('http://localhost:5050/api/health');
  console.log('Backend health after 10 concurrent requests:', healthRes.status);
}

run().catch(console.error);
