import { ISmsProvider } from "../sms.interface.js";
import { maskPhone } from "../../../common/utils/phone.js";

export class ConsoleSmsProvider extends ISmsProvider {
  constructor() {
    super();
    this.name = "console";
  }

  async sendSms(phone, text, meta = {}) {
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
