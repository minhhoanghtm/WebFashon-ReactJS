import otpService from "../otp.service.js";

describe("Secure OTP Service", () => {
  const testPhone = "+84901234567";
  const purpose = "register";

  afterEach(async () => {
    await otpService.deleteOtp(testPhone, purpose);
  });

  test("sinh mã OTP 6 số ngẫu nhiên an toàn", () => {
    for (let i = 0; i < 20; i++) {
      const otp = otpService.generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });

  test("lưu mã OTP băm và xác thực thành công mã đúng", async () => {
    // Clear cooldown if any from previous test
    await otpService.deleteOtp(testPhone, purpose);
    const { otp } = await otpService.createAndStoreOtp(testPhone, purpose);

    expect(otp).toBeDefined();
    const verified = await otpService.verifyOtp(testPhone, purpose, otp);
    expect(verified).toBe(true);

    // Single-use check: Không thể dùng lại lần 2
    await expect(otpService.verifyOtp(testPhone, purpose, otp)).rejects.toThrow(
      "Mã OTP đã hết hạn hoặc không tồn tại"
    );
  });

  test("từ chối mã OTP sai và giảm số lượt thử còn lại", async () => {
    const { otp } = await otpService.createAndStoreOtp("+84901234568", purpose);

    await expect(
      otpService.verifyOtp("+84901234568", purpose, "000000")
    ).rejects.toThrow("Mã OTP không chính xác. Bạn còn 4 lần thử.");

    // Nhập đúng sau khi nhập sai
    const verified = await otpService.verifyOtp("+84901234568", purpose, otp);
    expect(verified).toBe(true);
  });

  test("hủy OTP sau 5 lần nhập sai liên tiếp", async () => {
    await otpService.createAndStoreOtp("+84901234569", purpose);

    // 4 lần nhập sai
    for (let i = 4; i >= 1; i--) {
      await expect(
        otpService.verifyOtp("+84901234569", purpose, "111111")
      ).rejects.toThrow();
    }

    // Lần 5: OTP_TOO_MANY_ATTEMPTS
    await expect(
      otpService.verifyOtp("+84901234569", purpose, "111111")
    ).rejects.toThrow("Bạn đã nhập sai OTP quá 5 lần. Mã đã bị hủy");
  });

  test("áp dụng cooldown 60s khi yêu cầu OTP mới quá nhanh", async () => {
    const id = "+84901234570";
    await otpService.createAndStoreOtp(id, purpose);

    // Gọi lại ngay lập tức
    await expect(otpService.createAndStoreOtp(id, purpose)).rejects.toThrow(
      "Vui lòng chờ"
    );
  });
});
