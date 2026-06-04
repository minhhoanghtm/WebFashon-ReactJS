import userService from "./user.service.js";
import { successResponse } from "../../common/responses/index.js";

export const authMe = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const user = await userService.getMe(userId);
    return successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    return successResponse(res, users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const savedUser = await userService.createUser(req.body);
    return successResponse(res, savedUser, "Tạo tài khoản thành công", 201);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedUser = await userService.updateUser(id, req.body);
    return successResponse(res, updatedUser, "Cập nhật tài khoản thành công");
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedUser = await userService.deleteUser(id);
    return successResponse(res, deletedUser, "Xóa tài khoản thành công");
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    await userService.updatePassword(userId, currentPassword, newPassword);
    return successResponse(res, null, "Cập nhật mật khẩu thành công");
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const updatedUser = await userService.updateProfile(userId, req.body);
    return successResponse(res, updatedUser, "Cập nhật thông tin thành công");
  } catch (error) {
    next(error);
  }
};
