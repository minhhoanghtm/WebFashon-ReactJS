import { ISmsProvider } from "../sms.interface.js";
import { maskPhone, normalizeVietnamesePhone } from "../../../common/utils/phone.js";

export class ConsoleSmsProvider extends ISmsProvider {
  static lastSentOtps = new Map();

  static getLastOtp(phone) {
    if (!phone) return null;
    if (this.lastSentOtps.has(phone)) return this.lastSentOtps.get(phone);
    try {
      const normalized = normalizeVietnamesePhone(phone);
      if (this.lastSentOtps.has(normalized)) return this.lastSentOtps.get(normalized);
    } catch (_) {}
    return null;
  }

  constructor() {
    super();
    this.name = "console";
  }

  async sendSms(phone, text, meta = {}) {
    if (meta.otp) {
      ConsoleSmsProvider.lastSentOtps.set(phone, meta.otp);
    }

    const isProduction = process.env.NODE_ENV === "production";
    const masked = maskPhone(phone);
    const messageId = `mock-sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (!isProduction) {
      console.log(`\n================== [SMS CONSOLE DEV PROVIDER] ==================`);
      console.log(`📱 To: ${masked} (${phone})`);
      console.log(`💬 Message: "${text}"`);
      if (meta.otp) {
        console.log(`🔑 OTP Code: [ ${meta.otp} ] (Purpose: ${meta.purpose || "auth"})`);
      }
      console.log(`🆔 MessageId: ${messageId}`);
      console.log(`=================================================================\n`);
    }

    return {
      success: true,
      messageId,
      raw: { simulated: true, to: masked, purpose: meta.purpose },
    };
  }
}
