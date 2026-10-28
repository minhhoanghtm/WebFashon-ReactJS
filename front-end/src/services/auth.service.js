import { loginApi, registerApi, resetPasswordApi, sendOTPApi, sendResetOTPApi, verifyOTPApi } from "@/api/authApi";

//login
export const loginService = async (data) => {
  const res = await loginApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

//register
export const registerService = async (data) => {
  const res = await registerApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

//logout
export const logout = () => {
  localStorage.removeItem("accessToken");
};

export const sendOTPServive = async (data) => {
  const res = await sendOTPApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

export const sendResetOTPService = async (data) => {
  const res = await sendResetOTPApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

export const verifyOTPService = async (data) => {
  const res = await verifyOTPApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

export const resetPasswordService = async (data) => {
  const res = await resetPasswordApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};
