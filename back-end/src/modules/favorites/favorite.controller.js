import favoriteService from "./favorite.service.js";
import { successResponse } from "../../common/responses/index.js";

const getUserId = (req) => req.user?.userId;

export const getFavorites = async (req, res, next) => {
  try {
    const favorites = await favoriteService.getFavorites(getUserId(req));
    return successResponse(res, favorites, "Lấy danh sách yêu thích thành công");
  } catch (error) {
    next(error);
  }
};

export const addFavorite = async (req, res, next) => {
  try {
    const { product_id } = req.body;
    const favorites = await favoriteService.addFavorite(getUserId(req), product_id);
    return successResponse(res, favorites, "Đã thêm sản phẩm vào yêu thích");
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (req, res, next) => {
  try {
    const { product_id } = req.body;
    const result = await favoriteService.toggleFavorite(getUserId(req), product_id);
    return successResponse(res, result, "Cập nhật yêu thích thành công");
  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const favorites = await favoriteService.removeFavorite(getUserId(req), productId);
    return successResponse(res, favorites, "Đã xóa sản phẩm khỏi yêu thích");
  } catch (error) {
    next(error);
  }
};

export const clearFavorites = async (req, res, next) => {
  try {
    const favorites = await favoriteService.clearFavorites(getUserId(req));
    return successResponse(res, favorites, "Đã xóa toàn bộ danh sách yêu thích");
  } catch (error) {
    next(error);
  }
};
