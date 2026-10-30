import campaignService from "./campaign.service.js";
import { successResponse } from "../../common/responses/index.js";

// Public
export const getActiveCampaigns = async (req, res, next) => {
  try {
    const data = await campaignService.getActiveCampaigns();
    return successResponse(res, data, "Lấy danh sách chiến dịch đang diễn ra thành công");
  } catch (error) {
    next(error);
  }
};

export const getCampaignBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const data = await campaignService.getCampaignBySlug(slug, req.query);
    return successResponse(res, data, "Lấy chi tiết chiến dịch thành công");
  } catch (error) {
    next(error);
  }
};

// Admin
export const getAdminCampaigns = async (req, res, next) => {
  try {
    const data = await campaignService.getAdminCampaigns(req.query);
    return successResponse(res, data, "Lấy danh sách quản trị chiến dịch thành công");
  } catch (error) {
    next(error);
  }
};

export const getAdminCampaignDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await campaignService.getAdminCampaignDetail(id);
    return successResponse(res, data, "Lấy chi tiết quản trị chiến dịch thành công");
  } catch (error) {
    next(error);
  }
};

export const createCampaign = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const campaign = await campaignService.createCampaign(userId, req.body);
    return successResponse(res, campaign, "Tạo chiến dịch mới thành công", 201);
  } catch (error) {
    next(error);
  }
};

export const updateCampaign = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const campaign = await campaignService.updateCampaign(userId, id, req.body);
    return successResponse(res, campaign, "Cập nhật chiến dịch thành công");
  } catch (error) {
    next(error);
  }
};

export const deleteCampaign = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const result = await campaignService.deleteCampaign(userId, id);
    return successResponse(res, result, "Xóa chiến dịch thành công");
  } catch (error) {
    next(error);
  }
};

export const addCampaignProduct = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const product = await campaignService.addCampaignProduct(userId, id, req.body);
    return successResponse(res, product, "Thêm sản phẩm vào chiến dịch thành công", 201);
  } catch (error) {
    next(error);
  }
};

export const updateCampaignProduct = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { id, productId } = req.params;
    const updated = await campaignService.updateCampaignProduct(userId, id, productId, req.body);
    return successResponse(res, updated, "Cập nhật sản phẩm trong chiến dịch thành công");
  } catch (error) {
    next(error);
  }
};

export const removeCampaignProduct = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { id, productId } = req.params;
    const result = await campaignService.removeCampaignProduct(userId, id, productId);
    return successResponse(res, result, "Xóa sản phẩm khỏi chiến dịch thành công");
  } catch (error) {
    next(error);
  }
};

