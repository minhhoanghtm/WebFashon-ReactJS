import axiosClient from './axiosClient';

export const websiteSettingsApi = {
  getSettings: () => axiosClient.get('/settings'),
  updateSettings: (data) => axiosClient.put('/settings', data),
};

export default websiteSettingsApi;
