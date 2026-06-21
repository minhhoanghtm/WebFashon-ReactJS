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

const orderInfoVariants = [
  query.orderInfo,
  'Thanh+to%C3%A1n+%C4%91%C6%A1n+h%C3%A0ng+6a37c7e29fca1637b0ca8d51',
  'Thanh%20to%C3%A1n%20%C4%91%C6%A1n%20h%C3%A0ng%206a37c7e29fca1637b0ca8d51'
];

orderInfoVariants.forEach((info, idx) => {
  const rawString = `partnerCode=${query.partnerCode}&orderId=${query.orderId}&requestId=${query.requestId}&amount=${query.amount}&orderInfo=${info}&orderType=${query.orderType}&transId=${query.transId}&resultCode=${query.resultCode}&message=${query.message}&payType=${query.payType}&responseTime=${query.responseTime}&extraData=${query.extraData}`;
  const calculated = crypto.createHmac('sha256', secretKey)
    .update(rawString)
    .digest('hex');
  console.log(`Variant ${idx + 1} (Traditional Order):`);
  console.log("Calculated:", calculated);
  console.log("Expected  :", query.signature);
  console.log("Match?    :", calculated === query.signature);
});
