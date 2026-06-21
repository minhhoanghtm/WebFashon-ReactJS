import dotenv from 'dotenv';
dotenv.config();
import crypto from 'crypto';
import axios from 'axios';
class MomoProvider {
  async createPayment(order) {
    const uniqueId = `${order._id.toString()}_${Date.now()}`;
    const requestId = uniqueId;
    const orderId = uniqueId;
    const amount = order.total_price.toString();
    const orderInfo = `Thanh toán đơn hàng ${order._id.toString()}`;
    const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=&ipnUrl=${process.env.MOMO_IPN_URL}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${process.env.MOMO_PARTNER_CODE}&redirectUrl=${process.env.MOMO_REDIRECT_URL}&requestId=${requestId}&requestType=captureWallet`;
    const signature = crypto.createHmac('sha256', process.env.MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest('hex');
    const body = {
      partnerCode: process.env.MOMO_PARTNER_CODE,
      accessKey: process.env.MOMO_ACCESS_KEY,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: process.env.MOMO_REDIRECT_URL,
      ipnUrl: process.env.MOMO_IPN_URL,
      lang: process.env.MOMO_LANG || 'vn',
      requestType: 'captureWallet',
      autoCapture: true,
      extraData: '',
      signature
    }

    const response = await axios.post(process.env.MOMO_ENDPOINT, body);
    return response.data;
  }

  verifyReturn(query) {
    const signature = query.signature;
    const validKeys = [
      'partnerCode', 'orderId', 'requestId', 'amount', 'orderInfo',
      'orderType', 'transId', 'resultCode', 'message', 'payType',
      'responseTime', 'extraData', 'accessKey'
    ];
    
    const params = { ...query, accessKey: process.env.MOMO_ACCESS_KEY };
    const keys = Object.keys(params).filter(k => validKeys.includes(k) && params[k] !== undefined && params[k] !== null);
    keys.sort();
    
    const rawSignature = keys.map(k => `${k}=${params[k]}`).join('&');
    
    const calculatedSignature = crypto.createHmac('sha256', process.env.MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest('hex');

    return calculatedSignature === signature;
  }
};


export default new MomoProvider();
