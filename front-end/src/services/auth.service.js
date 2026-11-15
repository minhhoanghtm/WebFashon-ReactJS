import {
  loginApi,
  sendLoginOtpApi,
  verifyLoginOtpApi,
  sendRegisterOtpApi,
  verifyRegisterApi,
  forgotPasswordOtpApi,
  resetPasswordWithOtpApi,
  resendOtpApi,
  sendUpdatePhoneOtpApi,
  verifyAndUpdatePhoneApi,
  registerApi,
  resetPasswordApi,
  sendOTPApi,
  sendResetOTPApi,
  verifyOTPApi,
} from "@/api/authApi";

// ── Password / Phone Login ──────────────────────────────────────────────────
export const loginService = async (data) => {
  const res = await loginApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

// ── SMS OTP Login ──────────────────────────────────────────────────────────
export const sendLoginOtpService = async (data) => {
  const res = await sendLoginOtpApi(data);
  const result = res?.success !== undefined ? res : (res?.data ?? res);
  console.log("✅ Gửi OTP thành công (Đăng nhập OTP):", {
    phone: data?.phone,
    result,
  });
  return result;
};

export const verifyLoginOtpService = async (data) => {
  const res = await verifyLoginOtpApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

// ── Registration with SMS OTP ──────────────────────────────────────────────
export const sendRegisterOtpService = async (data) => {
  const res = await sendRegisterOtpApi(data);
  const result = res?.success !== undefined ? res : (res?.data ?? res);
  console.log("✅ Gửi OTP thành công (Đăng ký tài khoản):", {
    phone: data?.phone,
    channel: data?.channel || "sms",
    result,
  });
  return result;
};

export const verifyRegisterService = async (data) => {
  const res = await verifyRegisterApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

// ── Forgot & Reset Password ────────────────────────────────────────────────
export const forgotPasswordOtpService = async (data) => {
  const res = await forgotPasswordOtpApi(data);
  const result = res?.success !== undefined ? res : (res?.data ?? res);
  console.log("✅ Gửi OTP thành công (Quên / Đặt lại mật khẩu):", {
    identifier: data?.identifier,
    result,
  });
  return result;
};

export const resetPasswordWithOtpService = async (data) => {
  const res = await resetPasswordWithOtpApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

// ── Resend OTP ─────────────────────────────────────────────────────────────
export const resendOtpService = async (data) => {
  const res = await resendOtpApi(data);
  const result = res?.success !== undefined ? res : (res?.data ?? res);
  console.log("✅ Gửi lại OTP thành công:", {
    identifier: data?.identifier,
    purpose: data?.purpose,
    result,
  });
  return result;
};

// ── Profile Phone Verification ─────────────────────────────────────────────
export const sendUpdatePhoneOtpService = async (data) => {
  const res = await sendUpdatePhoneOtpApi(data);
  const result = res?.success !== undefined ? res : (res?.data ?? res);
  console.log("✅ Gửi OTP thành công (Cập nhật số điện thoại):", {
    phone: data?.phone,
    result,
  });
  return result;
};

export const verifyAndUpdatePhoneService = async (data) => {
  const res = await verifyAndUpdatePhoneApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

// ── Logout ─────────────────────────────────────────────────────────────────
export const logout = () => {
  localStorage.removeItem("accessToken");
};

// ── Legacy Compatibility ───────────────────────────────────────────────────
export const registerService = async (data) => {
  const res = await registerApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

export const sendOTPServive = async (data) => {
  const res = await sendOTPApi(data);
  const result = res?.success !== undefined ? res : (res?.data ?? res);
  console.log("✅ Gửi OTP email thành công:", { email: data?.email, result });
  return result;
};
export const sendOTPService = sendOTPServive;

export const sendResetOTPService = async (data) => {
  const res = await sendResetOTPApi(data);
  const result = res?.success !== undefined ? res : (res?.data ?? res);
  console.log("✅ Gửi OTP reset email thành công:", { email: data?.email, result });
  return result;
};

export const verifyOTPService = async (data) => {
  const res = await verifyOTPApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

export const resetPasswordService = async (data) => {
  const res = await resetPasswordApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};
