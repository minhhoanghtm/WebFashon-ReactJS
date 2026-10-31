import smsService from "../sms.service.js";
import { ConsoleSmsProvider } from "../providers/console.provider.js";
import { EsmsProvider } from "../providers/esms.provider.js";

describe("SMS Subsystem & Providers", () => {
  test("ConsoleSmsProvider gửi SMS giả lập thành công", async () => {
    const provider = new ConsoleSmsProvider();
    const result = await provider.sendSms("+84901234567", "Test SMS", {
      otp: "123456",
      purpose: "register",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toContain("mock-sms");
  });

  test("EsmsProvider xử lý chế độ Sandbox giả lập khi thiếu khóa API", async () => {
    const esms = new EsmsProvider({ apiKey: "", secretKey: "", isSandbox: true });
    const result = await esms.sendSms("+84901234567", "Test eSMS sandbox", {
      otp: "654321",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toContain("esms-sandbox");
  });

  test("SmsService điều phối gửi OTP thành công với provider console", async () => {
    const result = await smsService.sendOtpWithFallback({
      phone: "0901234567",
      otp: "123456",
      purpose: "login",
    });

    expect(result.success).toBe(true);
    expect(result.channel).toBe("sms");
    expect(result.phone).toBe("+84 90*** ***67");
  });
});
