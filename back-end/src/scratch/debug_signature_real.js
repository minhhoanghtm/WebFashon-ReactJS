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

const keysBase = Object.keys(query).filter(k => k !== 'signature');
keysBase.push('accessKey');

const orderInfoVariants = [
  'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51_1782040927055 qua MoMo',
  'Thanh+to%C3%A1n+%C4%91%C6%A1n+h%C3%A0ng+6a37c7e29fca1637b0ca8d51_1782040927055+qua+MoMo',
  'Thanh+to%C3%A1n+%C4%91%C6%A1n+h%C3%A0ng+6a37c7e29fca1637b0ca8d51_1782040927055+qua+MoMo'.replace(/\+/g, ' '),
  'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51',
  'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51_1782040927055'
];

const messageVariants = [
  'Success',
  'Successful.',
  'Successful'
];

const extraDataVariants = [
  '',
  undefined
];

const responseTimeVariants = [
  '1782040954546',
  undefined
];

let checkedCount = 0;
let found = false;

for (const orderInfo of orderInfoVariants) {
  for (const message of messageVariants) {
    for (const extraData of extraDataVariants) {
      for (const responseTime of responseTimeVariants) {
        
        const q = { ...query, accessKey, orderInfo, message };
        if (extraData !== undefined) q.extraData = extraData;
        if (responseTime !== undefined) q.responseTime = responseTime;
        
        const currentKeys = Object.keys(q);
        
        // Generate subsets of currentKeys
        const subsets = [[]];
        for (const element of currentKeys) {
          const length = subsets.length;
          for (let i = 0; i < length; i++) {
            subsets.push(subsets[i].concat(element));
          }
        }
        
        for (const subset of subsets) {
          if (subset.length === 0) continue;
          
          subset.sort();
          const rawString = subset.map(k => `${k}=${q[k]}`).join('&');
          const hash = crypto.createHmac('sha256', secretKey)
            .update(rawString)
            .digest('hex');
            
          checkedCount++;
          if (hash === query.signature) {
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

console.log(`Checked ${checkedCount} combinations.`);
if (!found) {
  console.log("No match found.");
}
