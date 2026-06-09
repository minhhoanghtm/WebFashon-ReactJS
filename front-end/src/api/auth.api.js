import axiosClient from './axiosClient';

export const authApi = {
  login: (data) => axiosClient.post('/auth/signIn', data),
  register: (data) => axiosClient.post('/auth/signUp', data),
  sendOTP: (data) => axiosClient.post('/auth/sendOTP', data),
  verifyOTP: (data) => axiosClient.post('/auth/verify-otp', data),
  resetPassword: (data) => axiosClient.post('/auth/resetPassword', data),
};
