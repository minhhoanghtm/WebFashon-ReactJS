import axiosClient from "./axiosClient";

// ── Password-based Login (accepts email OR phone) ───────────────────────────
export const loginApi = (data) => {
  return axiosClient.post("/auth/login", data);
};

// ── SMS OTP Login ──────────────────────────────────────────────────────────
export const sendLoginOtpApi = (data) => {
  return axiosClient.post("/auth/login/otp/send", data);
};

export const verifyLoginOtpApi = (data) => {
  return axiosClient.post("/auth/login/otp/verify", data);
};

// ── SMS OTP Registration ───────────────────────────────────────────────────
export const sendRegisterOtpApi = (data) => {
  return axiosClient.post("/auth/register/send-otp", data);
};

export const verifyRegisterApi = (data) => {
  return axiosClient.post("/auth/register/verify", data);
};

// ── Forgot & Reset Password with OTP ────────────────────────────────────────
export const forgotPasswordOtpApi = (data) => {
  return axiosClient.post("/auth/password/forgot", data);
};

export const resetPasswordWithOtpApi = (data) => {
  return axiosClient.post("/auth/password/reset", data);
};

// ── Resend OTP ─────────────────────────────────────────────────────────────
export const resendOtpApi = (data) => {
  return axiosClient.post("/auth/otp/resend", data);
};

// ── Profile Phone Verification ─────────────────────────────────────────────
export const sendUpdatePhoneOtpApi = (data) => {
  return axiosClient.put("/user/phone/send-otp", data);
};

export const verifyAndUpdatePhoneApi = (data) => {
  return axiosClient.put("/user/phone/verify", data);
};

// ── Legacy Auth APIs (Backwards Compatibility) ─────────────────────────────
export const registerApi = (data) => {
  return axiosClient.post("/auth/signUp", data);
};

export const sendOTPApi = (data) => {
  return axiosClient.post("/auth/sendOTP", data);
};

export const sendResetOTPApi = (data) => {
  return axiosClient.post("/auth/sendResetOTP", data);
};

export const verifyOTPApi = (data) => {
  return axiosClient.post("/auth/verify-otp", data);
};

export const resetPasswordApi = (data) => {
  return axiosClient.post("/auth/resetPassword", data);
};

export const signOutApi = () => {
  return axiosClient.post("/auth/signOut");
};
