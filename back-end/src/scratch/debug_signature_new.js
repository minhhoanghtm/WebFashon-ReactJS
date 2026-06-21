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
  amount: '332000',
  orderInfo: 'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51_1782040927055 qua MoMo',
  orderType: 'momo_wallet',
  transId: '4124976785',
  resultCode: '0',
  message: 'Successful.',
  payType: 'qr',
  signature: 'bc2ca4f981e4bdf002d9bb4e92a8536b33eb18635c9ad11e51b1f8eb4f9446d6'
};

const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';

// Let's brute force all subsets of query keys + accessKey
const keys = Object.keys(query).filter(k => k !== 'signature');
keys.push('accessKey');

const queryWithAccessKey = { ...query, accessKey };

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
console.log(`Checking ${subsets.length} combinations...`);

let found = false;

// We'll also try different orderInfo representations:
// 1. Raw decoded: "Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51_1782040927055 qua MoMo"
// 2. Encoded: "Thanh+to%C3%A1n+%C4%91%C6%A1n+h%C3%A0ng+6a37c7e29fca1637b0ca8d51_1782040927055+qua+MoMo"
const orderInfoVariants = [
  'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51_1782040927055 qua MoMo',
  'Thanh+to%C3%A1n+%C4%91%C6%A1n+h%C3%A0ng+6a37c7e29fca1637b0ca8d51_1782040927055+qua+MoMo',
  'Thanh%20to%C3%A1n%20%C4%91%C6%A1n%20h%C3%A0ng%206a37c7e29fca1637b0ca8d51_1782040927055%20qua%20MoMo'
];

for (const orderInfo of orderInfoVariants) {
  const currentQuery = { ...queryWithAccessKey, orderInfo };
  for (const subset of subsets) {
    if (subset.length === 0) continue;
    
    // Check alphabetically sorted order:
    subset.sort();
    const rawString = subset.map(k => `${k}=${currentQuery[k]}`).join('&');
    const hash = crypto.createHmac('sha256', secretKey)
      .update(rawString)
      .digest('hex');
      
    if (hash === query.signature) {
      console.log("🎉 MATCH FOUND (sorted):", rawString);
      found = true;
      break;
    }

    // Also check standard MoMo IPN signature ordering if all are present:
    // accessKey, amount, extraData, message, orderId, orderInfo, orderType, partnerCode, payType, requestId, responseTime, resultCode, transId
  }
  if (found) break;
}

if (!found) {
  console.log("No sorted key subset matches.");
}
