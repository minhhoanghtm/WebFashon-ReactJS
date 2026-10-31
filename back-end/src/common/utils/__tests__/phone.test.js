import {
  isValidVietnamesePhone,
  normalizeVietnamesePhone,
  maskPhone,
  formatPhoneForEsms,
} from "../phone.js";

describe("Vietnamese Phone Utility", () => {
  describe("isValidVietnamesePhone", () => {
    test("chấp nhận số điện thoại hợp lệ đầu 03, 05, 07, 08, 09", () => {
      expect(isValidVietnamesePhone("0901234567")).toBe(true);
      expect(isValidVietnamesePhone("0987654321")).toBe(true);
      expect(isValidVietnamesePhone("0321234567")).toBe(true);
      expect(isValidVietnamesePhone("0701234567")).toBe(true);
      expect(isValidVietnamesePhone("0561234567")).toBe(true);
      expect(isValidVietnamesePhone("0861234567")).toBe(true);
    });

    test("chấp nhận số có tiền tố +84 hoặc 84", () => {
      expect(isValidVietnamesePhone("+84901234567")).toBe(true);
      expect(isValidVietnamesePhone("84901234567")).toBe(true);
    });

    test("chấp nhận số có dấu cách, gạch ngang, chấm", () => {
      expect(isValidVietnamesePhone("090 123 4567")).toBe(true);
      expect(isValidVietnamesePhone("090-123-4567")).toBe(true);
      expect(isValidVietnamesePhone("090.123.4567")).toBe(true);
      expect(isValidVietnamesePhone("+84 90 123 4567")).toBe(true);
    });

    test("từ chối số không hợp lệ", () => {
      expect(isValidVietnamesePhone("")).toBe(false);
      expect(isValidVietnamesePhone("123456")).toBe(false);
      expect(isValidVietnamesePhone("0241234567")).toBe(false); // Số bàn Hà Nội
      expect(isValidVietnamesePhone("0123456789")).toBe(false); // Đầu 01x đã đổi
      expect(isValidVietnamesePhone("090123456789")).toBe(false); // Quá 10 số
      expect(isValidVietnamesePhone("abc0901234")).toBe(false);
    });
  });

  describe("normalizeVietnamesePhone", () => {
    test("chuẩn hóa về định dạng E.164 (+84...)", () => {
      expect(normalizeVietnamesePhone("0901234567")).toBe("+84901234567");
      expect(normalizeVietnamesePhone("84901234567")).toBe("+84901234567");
      expect(normalizeVietnamesePhone("+84901234567")).toBe("+84901234567");
      expect(normalizeVietnamesePhone("098 765 4321")).toBe("+84987654321");
    });

    test("ném lỗi khi số không hợp lệ", () => {
      expect(() => normalizeVietnamesePhone("0123456")).toThrow();
      expect(() => normalizeVietnamesePhone("0241234567")).toThrow();
    });
  });

  describe("maskPhone", () => {
    test("che các số giữa, giữ lại mã quốc gia và 2 số cuối", () => {
      const masked = maskPhone("0901234567");
      expect(masked).toBe("+84 90*** ***67");
    });
  });

  describe("formatPhoneForEsms", () => {
    test("bỏ dấu cộng phía trước cho eSMS API", () => {
      expect(formatPhoneForEsms("0901234567")).toBe("84901234567");
    });
  });
});
