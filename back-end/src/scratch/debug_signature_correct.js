import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';

// Case 1: The query from the debug_signature.js file
const query1 = {
  partnerCode: 'MOMO',
  orderId: '6a37c7e29fca1637b0ca8d51_1782040927055',
  requestId: '6a37c7e29fca1637b0ca8d51_1782040927055',
  amount: '1080500',
  orderInfo: 'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51_1782040927055 qua MoMo', // Let's check with suffix or without
  orderType: 'momo_wallet',
  transId: '4340578643',
  resultCode: '0',
  message: 'Success',
  payType: 'qr',
  responseTime: '1782040954546',
  extraData: '',
  signature: 'bc2ca4f981e4bdf002d9bb4e92a8536b33eb18635c9ad11e51b1f8eb4f9446d6'
};

const orderInfoVariants = [
  'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51',
  'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51_1782040927055 qua MoMo',
  'Thanh+to%C3%A1n+%C4%91%C6%A1n+h%C3%A0ng+6a37c7e29fca1637b0ca8d51_1782040927055+qua+MoMo',
  'Thanh+to%C3%A1n+%C4%91%C6%A1n+h%C3%A0ng+6a37c7e29fca1637b0ca8d51_1782040927055+qua+MoMo'.replace(/\+/g, ' '),
  'Thanh toán đơn hàng 6a37c7e29fca1637b0ca8d51_1782040927055',
];

orderInfoVariants.forEach((orderInfo, idx) => {
  const q = { ...query1, orderInfo };
  
  // Standard alphabetical:
  // accessKey, amount, extraData, message, orderId, orderInfo, orderType, partnerCode, payType, requestId, responseTime, resultCode, transId
  const rawString = `accessKey=${accessKey}&amount=${q.amount}&extraData=${q.extraData}&message=${q.message}&orderId=${q.orderId}&orderInfo=${q.orderInfo}&orderType=${q.orderType}&partnerCode=${q.partnerCode}&payType=${q.payType}&requestId=${q.requestId}&responseTime=${q.responseTime}&resultCode=${q.resultCode}&transId=${q.transId}`;
  
  const calculated = crypto.createHmac('sha256', secretKey)
    .update(rawString)
    .digest('hex');
    
  console.log(`Variant ${idx + 1} (${orderInfo}):`);
  console.log("Calculated:", calculated);
  console.log("Expected  :", q.signature);
  console.log("Match?    :", calculated === q.signature);
});
