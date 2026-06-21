import dotenv from "dotenv";
dotenv.config();
import moment from "moment";
import qs from "qs";
import crypto from "crypto";
class VNPAYProvider {
  //Sắp xếp các key của object theo thứ tự alphabet
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).map(k => encodeURIComponent(k)).sort();

    keys.forEach((key) => {
      const val = obj[decodeURIComponent(key)];
      if (val !== undefined && val !== null) {
        sorted[key] = encodeURIComponent(val).replace(/%20/g, "+");
      }
    });

    return sorted;
  }

  //Tạo URL thanh toán VNPAY
  createPaymantUrl(order, ipAddress) {
    const createDate = moment().format("YYYYMMDDHHmmss");

    let vnp_Params = {
      vnp_Version: process.env.VNPAY_VERSION,
      vnp_Command: process.env.VNPAY_COMMAND,
      vnp_TmnCode: process.env.VNP_TMNCODE,
      vnp_Amount: order.total_price * 100,
      vnp_CreateDate: createDate,
      vnp_CurrCode: process.env.VNPAY_CURRCODE,
      vnp_IpAddr: ipAddress,
      vnp_Locale: process.env.VNPAY_LOCALE,
      vnp_OrderInfo: `Thanh toán đơn hàng ${order._id}`,
      vnp_OrderType: process.env.VNPAY_ORDERTYPE,
      vnp_ReturnUrl: process.env.VNP_RETURNURL,
      vnp_TxnRef: order._id.toString(),
    };

    vnp_Params = this.sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });
    const secureHash = crypto
      .createHmac("sha512", process.env.VNP_HASHSECRET)
      .update(signData, "utf-8")
      .digest("hex");
    vnp_Params.vnp_SecureHash = secureHash;

    return (
        process.env.VNP_URL + "?" + qs.stringify(vnp_Params, { encode: false })
    )
  }

  verifyReturn(query) {
    const vnp_SecureHash = query.vnp_SecureHash;
    
    delete query.vnp_SecureHash;
    delete query.vnp_SecureHashType;

    const sortedparams = this.sortObject(query);
    const signData = qs.stringify(sortedparams, { encode: false });
    const secureHash = crypto
      .createHmac("sha512", process.env.VNP_HASHSECRET)
      .update(signData, "utf-8")
      .digest("hex");
    return secureHash === vnp_SecureHash;
  }
}

export default new VNPAYProvider();
