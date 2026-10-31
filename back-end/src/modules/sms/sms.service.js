import { ConsoleSmsProvider } from "./providers/console.provider.js";
import { EsmsProvider } from "./providers/esms.provider.js";
import { maskPhone, normalizeVietnamesePhone } from "../../common/utils/phone.js";
import { addEmailJob } from "../../queues/index.js";

class SmsService {
  constructor() {
    this.providers = new Map();
    this.activeProviderName = process.env.SMS_PROVIDER || "console";

    // Register built-in providers
    this.registerProvider("console", new ConsoleSmsProvider());
    this.registerProvider("esms", new EsmsProvider());
  }

  registerProvider(name, providerInstance) {
    this.providers.set(name.toLowerCase(), providerInstance);
  }

  getProvider(name) {
    const provider = this.providers.get((name || this.activeProviderName).toLowerCase());
    if (!provider) {
      console.warn(
        `SMS Provider '${name}' không tồn tại. Mặc định chuyển sang 'console'.`
      );
      return this.providers.get("console");
    }
    return provider;
  }

  /**
   * Send SMS via active provider
   */
  async sendSms(rawPhone, text, meta = {}) {
    const phone = normalizeVietnamesePhone(rawPhone);
    const provider = this.getProvider();
    return await provider.sendSms(phone, text, meta);
  }

  /**
   * Build branded OTP message content
   */
  buildOtpMessage(otp, purpose = "xác thực") {
    const purposeMap = {
      register: "dang ky tai khoan",
      login: "dang nhap",
      reset_password: "dat lai mat khau",
      verify_phone: "xac thuc so dien thoai",
    };
    const action = purposeMap[purpose] || "xac thuc";
    return `[404 STUDIO] Ma OTP ${action} cua ban la: ${otp}. Hieu luc trong 5 phut. Khong chia se ma nay voi bat ky ai.`;
  }

  /**
   * Send OTP via SMS with automatic email fallback if SMS fails and email is provided
   */
  async sendOtpWithFallback({ phone, email, otp, purpose }) {
    const normPhone = phone ? normalizeVietnamesePhone(phone) : null;
    let smsResult = { success: false };

    if (normPhone) {
      const message = this.buildOtpMessage(otp, purpose);
      smsResult = await this.sendSms(normPhone, message, { otp, purpose });
    }

    // If SMS succeeded
    if (smsResult.success) {
      return {
        success: true,
        channel: "sms",
        phone: maskPhone(normPhone),
        messageId: smsResult.messageId,
        message: "Mã OTP đã được gửi đến số điện thoại của bạn.",
      };
    }

    // If SMS failed or phone was not provided, attempt fallback to email if email exists
    if (email) {
      console.warn(
        `[SMS Fallback] Gửi SMS tới ${phone ? maskPhone(phone) : "N/A"} thất bại (${smsResult.error || "Không có số điện thoại"}). Chuyển sang gửi OTP qua Email: ${email}`
      );
      try {
        await addEmailJob(email, otp);
        return {
          success: true,
          channel: "email",
          fallback: true,
          email,
          message: "Không thể gửi SMS, mã OTP đã được chuyển sang email của bạn.",
        };
      } catch (emailErr) {
        console.error("[Email Fallback Error]", emailErr.message);
      }
    }

    // If both failed
    return {
      success: false,
      channel: normPhone ? "sms" : "email",
      error: smsResult.error || "Không thể gửi mã xác thực OTP.",
      code: smsResult.code || "OTP_SEND_FAILED",
    };
  }
}

export default new SmsService();
