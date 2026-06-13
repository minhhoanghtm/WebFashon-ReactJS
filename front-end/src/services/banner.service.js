import bannerApi from "../api/banner.api";

export const getActiveBannersService = async () => {
  const res = await bannerApi.getActiveBanners();
  return res.data?.data ?? res.data ?? [];
};

export const getAllBannersService = async (params) => {
  const res = await bannerApi.getAllBanners(params);
  return res.data?.data ?? res.data ?? { items: [], pagination: {} };
};

export const getBannerByIdService = async (id) => {
  const res = await bannerApi.getBannerById(id);
  return res.data?.data ?? res.data ?? null;
};

export const createBannerService = async (data) => {
  const res = await bannerApi.createBanner(data);
  return res.data?.data ?? res.data;
};

export const updateBannerService = async (id, data) => {
  const res = await bannerApi.updateBanner(id, data);
  return res.data?.data ?? res.data;
};

export const deleteBannerService = async (id) => {
  const res = await bannerApi.deleteBanner(id);
  return res.data?.data ?? res.data;
};

export const toggleBannerStatusService = async (id) => {
  const res = await bannerApi.toggleBannerStatus(id);
  return res.data?.data ?? res.data;
};

export const trackBannerClickService = async (id) => {
  try {
    const res = await bannerApi.trackClick(id);
    return res.data?.data ?? res.data;
  } catch (error) {
    console.error("Lỗi khi ghi nhận click banner:", error);
  }
};
