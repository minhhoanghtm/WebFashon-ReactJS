import axiosClient from "./axiosClient";

// login
export const loginApi = (data) => {
  return axiosClient.post("/auth/signIn", data);
};

// register
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
