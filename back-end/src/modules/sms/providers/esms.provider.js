import axios from "axios";
import { ISmsProvider } from "../sms.interface.js";
import { formatPhoneForEsms, maskPhone } from "../../../common/utils/phone.js";

const ESMS_API_ENDPOINT =
  process.env.ESMS_ENDPOINT ||
  "http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json";

export class EsmsProvider extends ISmsProvider {
  constructor(config = {}) {
    super();
    this.name = "esms";
    this.apiKey = config.apiKey || process.env.ESMS_API_KEY || "";
    this.secretKey = config.secretKey || process.env.ESMS_SECRET_KEY || "";
    this.isSandbox =
      config.isSandbox !== undefined
        ? config.isSandbox
        : process.env.ESMS_SANDBOX === "1";
    this.smsType = config.smsType || process.env.ESMS_SMS_TYPE || "2"; // 2: CSKH, 4: Brandname OTP
    this.brandname = config.brandname || process.env.ESMS_BRANDNAME || "Baotam";
    this.timeout = config.timeout || 5000;
    this.maxRetries = config.maxRetries !== undefined ? config.maxRetries : 2;
  }

  /**
   * Send SMS via official eSMS REST API
   * @param {string} phone - Normalized E.164 phone
   * @param {string} text - Message content
   * @param {Object} [meta]
   */
  async sendSms(phone, text, meta = {}) {
    const masked = maskPhone(phone);
    const esmsPhone = formatPhoneForEsms(phone);

    // If API credentials are not set and we are in sandbox/dev mode, simulate gracefully
    if (!this.apiKey || !this.secretKey) {
      if (this.isSandbox || process.env.NODE_ENV !== "production") {
        console.warn(
          `[eSMS] Missing ESMS_API_KEY / ESMS_SECRET_KEY. Simulating delivery in sandbox mode for ${masked}`
        );
        return {
          success: true,
          messageId: `esms-sandbox-${Date.now()}`,
          raw: { CodeResult: "100", SMSID: `sandbox-${Date.now()}` },
        };
      }
      return {
        success: false,
        error: "Chưa cấu hình eSMS API Key hoặc Secret Key.",
        code: "ESMS_CREDENTIALS_MISSING",
      };
    }

    const payload = {
      ApiKey: this.apiKey,
      SecretKey: this.secretKey,
      Content: text,
      Phone: esmsPhone,
      IsSandbox: this.isSandbox ? "1" : "0",
      SmsType: String(this.smsType),
      Brandname: this.brandname,
      ...(meta.callbackUrl && { CallbackUrl: meta.callbackUrl }),
      ...(meta.requestId && { RequestId: meta.requestId }),
    };

    let attempt = 0;
    let lastError = null;

    while (attempt <= this.maxRetries) {
      attempt++;
      try {
        const response = await axios.post(ESMS_API_ENDPOINT, payload, {
          timeout: this.timeout,
          headers: { "Content-Type": "application/json" },
        });

        const data = response.data || {};
        const codeResult = String(data.CodeResult);

        // eSMS CodeResult 100 indicates success
        if (codeResult === "100") {
          return {
            success: true,
            messageId: data.SMSID || `esms-${Date.now()}`,
            raw: data,
          };
        }

        // Map known eSMS errors
        const errorMap = {
          "101": "eSMS: Đăng nhập thất bại (sai API Key hoặc Secret Key).",
          "102": "eSMS: Tài khoản bị khóa.",
          "103": "eSMS: Số dư tài khoản không đủ.",
          "104": "eSMS: Brandname không tồn tại hoặc chưa duyệt.",
          "105": "eSMS: Nội dung tin nhắn không hợp lệ.",
          "106": "eSMS: Số điện thoại không hợp lệ.",
          "99": "eSMS: Lỗi hệ thống nhà cung cấp mạng.",
        };

        const errorMsg =
          errorMap[codeResult] || data.ErrorMessage || `eSMS Lỗi mã ${codeResult}`;

        console.error(
          `[eSMS Error] To: ${masked}, Code: ${codeResult}, Msg: ${errorMsg}`
        );

        return {
          success: false,
          error: errorMsg,
          code: `ESMS_ERR_${codeResult}`,
          raw: data,
        };
      } catch (err) {
        lastError = err;
        console.warn(
          `[eSMS Attempt ${attempt}/${this.maxRetries + 1} Failed] To: ${masked}: ${err.message}`
        );
        if (attempt <= this.maxRetries) {
          // Exponential backoff: 300ms, 600ms
          await new Promise((resolve) => setTimeout(resolve, attempt * 300));
        }
      }
    }

    return {
      success: false,
      error: `eSMS request timeout / mạng lỗi: ${lastError?.message || "Không có phản hồi"}`,
      code: "ESMS_NETWORK_ERROR",
    };
  }
}
