import axiosClient from './axiosClient';

export const authApi = {
  login: (data) => axiosClient.post('/auth/login', data),
  sendLoginOtp: (data) => axiosClient.post('/auth/login/otp/send', data),
  verifyLoginOtp: (data) => axiosClient.post('/auth/login/otp/verify', data),
  register: (data) => axiosClient.post('/auth/register/verify', data),
  sendRegisterOtp: (data) => axiosClient.post('/auth/register/send-otp', data),
  verifyRegister: (data) => axiosClient.post('/auth/register/verify', data),
  forgotPassword: (data) => axiosClient.post('/auth/password/forgot', data),
  resetPasswordWithOtp: (data) => axiosClient.post('/auth/password/reset', data),
  resendOtp: (data) => axiosClient.post('/auth/otp/resend', data),
  sendOTP: (data) => axiosClient.post('/auth/sendOTP', data),
  verifyOTP: (data) => axiosClient.post('/auth/verify-otp', data),
  resetPassword: (data) => axiosClient.post('/auth/resetPassword', data),
  signOut: () => axiosClient.post('/auth/signOut'),
};
