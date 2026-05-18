import api from "./api";

// login
export const loginApi = (data) => {
  return api.post("/auth/signIn", data);
};

// register
export const registerApi = (data) => {
  return api.post("/auth/signUp", data);
};

export const sendOTPApi = (data) => {
  return api.post("/auth/sendOTP", data);
}

export const verifyOTPApi = (data) => {
  return api.post("/auth/verify-otp", data);
}

export const resetPasswordApi = (data) => {
  return api.post("/auth/resetPassword", data);
}