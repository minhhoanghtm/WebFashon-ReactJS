import axiosClient from './axiosClient';

export const userApi = {
  getMe: () => axiosClient.get('/user/me'),
  updatePassword: (data) => axiosClient.put('/user/updatePassword', data),
  updateProfile: (data) => axiosClient.put('/user/updateProfile', data),
};
