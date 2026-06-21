import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';

const expectedSignature = 'bc2ca4f981e4bdf002d9bb4e92a8536b33eb18635c9ad11e51b1f8eb4f9446d6';

// Let's define the pool of keys and values we want to test:
const baseQuery = {
  partnerCode: 'MOMO',
  orderId: '6a37c7e29fca1637b0ca8d51_1782040927055',
  requestId: '6a37c7e29fca1637b0ca8d51_1782040927055',
  amount: '1080500',
  transId: '4340578643',
  resultCode: '0',
  responseTime: '1782040954546',
  accessKey: accessKey
};

// Variants to check
const orderInfoVariants = [
  'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51',
  'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51_1782040927055',
  'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51_1782040927055 qua MoMo',
  'Thanh+to%C3%A1n+%C4%91%C6%A1n+h%C3%A0ng+6a37c7e29fca1637b0ca8d51_1782040927055+qua+MoMo',
  'Thanh+to%C3%A1n+%C4%91%C6%A1n+h%C3%A0ng+6a37c7e29fca1637b0ca8d51_1782040927055+qua+MoMo'.replace(/\+/g, ' '),
];

const messageVariants = [
  'Success',
  'Successful.',
  'Successful'
];

const extraDataVariants = [
  '',
  'eyJnZW1pbmkiOiJ0ZXN0In0=' // some base64 or undefined
];

const orderTypeVariants = [
  'momo_wallet',
  undefined
];

const payTypeVariants = [
  'qr',
  'webApp',
  undefined
];

let checkedCount = 0;
let found = false;

for (const orderInfo of orderInfoVariants) {
  for (const message of messageVariants) {
    for (const extraData of extraDataVariants) {
      for (const orderType of orderTypeVariants) {
        for (const payType of payTypeVariants) {
          
          const q = { ...baseQuery, orderInfo, message, extraData };
          if (orderType !== undefined) q.orderType = orderType;
          if (payType !== undefined) q.payType = payType;
          
          const keys = Object.keys(q);
          
          // Let's try different key subsets (since some optional keys might be omitted)
          // We can generate subsets of optional keys: orderType, payType, extraData
          const optionalKeys = [];
          if (orderType !== undefined) optionalKeys.push('orderType');
          if (payType !== undefined) optionalKeys.push('payType');
          if (extraData !== undefined) optionalKeys.push('extraData');
          
          // Generate all subsets of optionalKeys
          const subsets = [[]];
          for (const key of optionalKeys) {
            const len = subsets.length;
            for (let i = 0; i < len; i++) {
              subsets.push(subsets[i].concat(key));
            }
          }
          
          const requiredKeys = keys.filter(k => !optionalKeys.includes(k));
          
          for (const subset of subsets) {
            const finalKeys = [...requiredKeys, ...subset];
            
            // Try sorting alphabetically
            finalKeys.sort();
            
            const rawString = finalKeys.map(k => `${k}=${q[k]}`).join('&');
            const hash = crypto.createHmac('sha256', secretKey)
              .update(rawString)
              .digest('hex');
              
            checkedCount++;
            if (hash === expectedSignature) {
              console.log("🎉 MATCH FOUND!");
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
  if (found) break;
}

console.log(`Checked ${checkedCount} combinations.`);
if (!found) {
  console.log("No match found.");
}
