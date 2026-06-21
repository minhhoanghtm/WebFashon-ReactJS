import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';

const query = {
  partnerCode: 'MOMO',
  orderId: '6a37c7e29fca1637b0ca8d51_1782040927055',
  requestId: '6a37c7e29fca1637b0ca8d51_1782040927055',
  amount: '1080500',
  orderType: 'momo_wallet',
  transId: '4340578643',
  resultCode: '0',
  payType: 'qr',
  signature: 'bc2ca4f981e4bdf002d9bb4e92a8536b33eb18635c9ad11e51b1f8eb4f9446d6'
};

const keys = Object.keys(query).filter(k => k !== 'signature');
keys.push('accessKey');

const queryWithAccessKey = { ...query, accessKey };

// All possible subsets of keys
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

// Different versions of orderInfo
const baseOrderInfo = 'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51_1782040927055 qua MoMo';
const orderInfoVariants = [
  baseOrderInfo,
  encodeURIComponent(baseOrderInfo),
  encodeURI(baseOrderInfo),
  'Thanh+to%C3%A1n+%C4%91%C6%A1n+h%C3%A0ng+6a37c7e29fca1637b0ca8d51_1782040927055+qua+MoMo',
  'Thanh%20to%C3%A1n%20%C4%91%C6%A1n%20h%C3%A0ng%206a37c7e29fca1637b0ca8d51_1782040927055%20qua%20MoMo',
  'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51',
  'Thanh+to%C3%A1n+%C4%91%C6%A1n+h%C3%A0ng+6a37c7e29fca1637b0ca8d51',
  'Thanh%20to%C3%A1n%20%C4%91%C6%A1n%20h%C3%A0ng%206a37c7e29fca1637b0ca8d51'
];

const messageVariants = ['Success', 'Successful.'];
const extraDataVariants = ['', undefined];
const responseTimeVariants = ['1782040954546', undefined];

let checked = 0;
let found = false;

for (const orderInfo of orderInfoVariants) {
  for (const message of messageVariants) {
    for (const extraData of extraDataVariants) {
      for (const responseTime of responseTimeVariants) {
        const q = { ...queryWithAccessKey, orderInfo, message };
        if (extraData !== undefined) q.extraData = extraData;
        if (responseTime !== undefined) q.responseTime = responseTime;
        
        for (const subset of subsets) {
          if (subset.length === 0) continue;
          subset.sort();
          
          const rawString = subset.map(k => `${k}=${q[k]}`).join('&');
          const hash = crypto.createHmac('sha256', secretKey)
            .update(rawString)
            .digest('hex');
          
          checked++;
          if (hash === query.signature) {
            console.log("🎉🎉 MATCH FOUND!");
            console.log("Raw String:", rawString);
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }
    if (found) break;
  }
  if (found) break;
}

console.log(`Checked ${checked} combinations.`);
if (!found) {
  console.log("No match found.");
}
