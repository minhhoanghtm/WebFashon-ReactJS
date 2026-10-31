const COMMON_PASSWORDS = new Set([
  "password",
  "12345678",
  "123456789",
  "1234567890",
  "admin123",
  "password123",
  "qwerty123",
  "iloveyou",
  "webfashion123",
  "11112222",
  "12344321",
]);

export function validatePasswordStrength(password) {
  if (!password || typeof password !== "string") {
    return {
      isValid: false,
      message: "Vui lòng nhập mật khẩu.",
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: "Mật khẩu phải có độ dài tối thiểu 8 ký tự.",
    };
  }

  // Must contain both letters and digits
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  if (!hasLetter || !hasDigit) {
    return {
      isValid: false,
      message: "Mật khẩu phải bao gồm cả chữ cái và chữ số.",
    };
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase().trim())) {
    return {
      isValid: false,
      message: "Mật khẩu này quá phổ biến và dễ đoán. Vui lòng chọn mật khẩu an toàn hơn.",
    };
  }

  return { isValid: true };
}
