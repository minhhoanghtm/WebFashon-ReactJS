import bannerService from "./banner.service.js";
import { successResponse } from "../../common/responses/index.js";

export const getActiveBanners = async (req, res, next) => {
  try {
    const banners = await bannerService.getActiveBanners();
    return successResponse(res, banners, "Lấy danh sách banner hoạt động thành công");
  } catch (error) {
    next(error);
  }
};

export const getAllBanners = async (req, res, next) => {
  try {
    const result = await bannerService.getAllBanners(req.query);
    return successResponse(res, result, "Lấy danh sách tất cả banner thành công");
  } catch (error) {
    next(error);
  }
};

export const getBannerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await bannerService.getBannerById(id);
    return successResponse(res, banner, "Lấy thông tin chi tiết banner thành công");
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const adminId = req.user?.userId;
    const banner = await bannerService.createBanner(adminId, req.body);
    return successResponse(res, banner, "Tạo banner thành công", 201);
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const banner = await bannerService.updateBanner(adminId, id, req.body);
    return successResponse(res, banner, "Cập nhật thông tin banner thành công");
  } catch (error) {
    next(error);
  }
};

export const toggleBannerStatus = async (req, res, next) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const banner = await bannerService.toggleBannerStatus(adminId, id);
    return successResponse(res, banner, "Thay đổi trạng thái hoạt động banner thành công");
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const result = await bannerService.deleteBanner(adminId, id);
    return successResponse(res, result, "Xóa banner thành công");
  } catch (error) {
    next(error);
  }
};

export const trackClick = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await bannerService.trackClick(id);
    return successResponse(res, banner, "Ghi nhận lượt click banner thành công");
  } catch (error) {
    next(error);
  }
};
