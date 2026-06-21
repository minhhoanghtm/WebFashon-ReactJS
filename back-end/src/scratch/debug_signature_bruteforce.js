import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const query = {
  partnerCode: 'MOMO',
  orderId: '6a37c7e29fca1637b0ca8d51_1782040927055',
  requestId: '6a37c7e29fca1637b0ca8d51_1782040927055',
  amount: '1080500',
  orderInfo: 'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51',
  orderType: 'momo_wallet',
  transId: '4340578643',
  resultCode: '0',
  message: 'Success',
  payType: 'qr',
  responseTime: '1782040954546',
  extraData: '',
  accessKey: 'F8BBA842ECF85'
};

const expectedSignature = 'bc2ca4f981e4bdf002d9bb4e92a8536b33eb18635c9ad11e51b1f8eb4f9446d6';
const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';

const keys = Object.keys(query);

// Helper to generate power set (subsets)
function getSubsets(array) {
  const result = [[]];
  for (const element of array) {
    const length = result.length;
    for (let i = 0; i < length; i++) {
      result.push(result[i].concat(element));
    }
  }
  return result;
}

const subsets = getSubsets(keys);
console.log(`Generated ${subsets.length} subsets to check...`);

let found = false;
for (const subset of subsets) {
  if (subset.length === 0) continue;
  
  // Sort keys alphabetically
  subset.sort();
  
  // Construct raw string
  const rawString = subset.map(k => `${k}=${query[k]}`).join('&');
  
  const hash = crypto.createHmac('sha256', secretKey)
    .update(rawString)
    .digest('hex');
    
  if (hash === expectedSignature) {
    console.log("🎉 MATCH FOUND!");
    console.log("Raw String:", rawString);
    found = true;
    break;
  }
}

if (!found) {
  console.log("No exact match found with raw values. Trying URL-encoded values for orderInfo...");
  const queryEncoded = { ...query, orderInfo: 'Thanh+to%C3%A1n+%C4%91%C6%A1n+h%C3%A0ng+6a37c7e29fca1637b0ca8d51' };
  
  for (const subset of subsets) {
    if (subset.length === 0) continue;
    subset.sort();
    const rawString = subset.map(k => `${k}=${queryEncoded[k]}`).join('&');
    const hash = crypto.createHmac('sha256', secretKey)
      .update(rawString)
      .digest('hex');
      
    if (hash === expectedSignature) {
      console.log("🎉 MATCH FOUND (with encoded orderInfo)!");
      console.log("Raw String:", rawString);
      found = true;
      break;
    }
  }
}

if (!found) {
  console.log("No match found with either encoding.");
}
