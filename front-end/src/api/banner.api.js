import axiosClient from './axiosClient';

export const bannerApi = {
  getActiveBanners: () => axiosClient.get('/banners/active'),
  getAllBanners: (params) => axiosClient.get('/banners', { params }),
  getBannerById: (id) => axiosClient.get(`/banners/${id}`),
  createBanner: (data) => axiosClient.post('/banners', data),
  updateBanner: (id, data) => axiosClient.put(`/banners/${id}`, data),
  deleteBanner: (id) => axiosClient.delete(`/banners/${id}`),
  toggleBannerStatus: (id) => axiosClient.patch(`/banners/${id}/toggle-status`),
  trackClick: (id) => axiosClient.post(`/banners/${id}/click`),
};

export default bannerApi;
