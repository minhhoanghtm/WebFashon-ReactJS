import websiteSettingsApi from "../api/websiteSettings.api";

export const getWebsiteSettingsService = async () => {
  const res = await websiteSettingsApi.getSettings();
  return res.data?.data ?? res.data ?? res;
};

export const updateWebsiteSettingsService = async (data) => {
  const res = await websiteSettingsApi.updateSettings(data);
  return res.data?.data ?? res.data ?? res;
};
