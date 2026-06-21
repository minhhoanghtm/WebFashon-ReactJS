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
  signature: 'bc2ca4f981e4bdf002d9bb4e92a8536b33eb18635c9ad11e51b1f8eb4f9446d6'
};

const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';

const orderInfoVariants = [
  query.orderInfo,
  'Thanh+to%C3%A1n+%C4%91%C6%A1n+h%C3%A0ng+6a37c7e29fca1637b0ca8d51',
  'Thanh%20to%C3%A1n%20%C4%91%C6%A1n%20h%C3%A0ng%206a37c7e29fca1637b0ca8d51'
];

orderInfoVariants.forEach((info, idx) => {
  const rawString = `accessKey=${accessKey}&amount=${query.amount}&extraData=${query.extraData}&message=${query.message}&orderId=${query.orderId}&orderInfo=${info}&orderType=${query.orderType}&partnerCode=${query.partnerCode}&payType=${query.payType}&requestId=${query.requestId}&responseTime=${query.responseTime}&resultCode=${query.resultCode}&transId=${query.transId}`;
  const calculated = crypto.createHmac('sha256', secretKey)
    .update(rawString)
    .digest('hex');
  console.log(`Variant ${idx + 1}:`);
  console.log("Calculated:", calculated);
  console.log("Expected  :", query.signature);
  console.log("Match?    :", calculated === query.signature);
});
