import mongoose from "mongoose";
import { AppError } from "../../common/exceptions/AppError.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{9,11}$/;

export const validateCreateUser = (req, res, next) => {
  const { email, passWord, fullName, role, sex } = req.body;

  if (!email || !passWord || !fullName) {
    return next(new AppError("Thiếu thông tin bắt buộc (email, passWord, fullName)", 400));
  }

  if (!emailRegex.test(email)) {
    return next(new AppError("Định dạng email không hợp lệ!", 400));
  }

  if (passWord.length < 6) {
    return next(new AppError("Mật khẩu phải có ít nhất 6 ký tự!", 400));
  }

  if (role && !["user",  "admin"].includes(role)) {
    return next(new AppError("Role không hợp lệ! Chỉ chấp nhận: user, admin", 400));
  }

  if (sex && !["male", "female"].includes(sex)) {
    return next(new AppError("Giới tính không hợp lệ! Chỉ chấp nhận: male, female", 400));
  }

  next();
};

export const validateUpdateUser = (req, res, next) => {
  const { id } = req.params;
  const { email, passWord, role, sex } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("ID người dùng không hợp lệ", 400));
  }

  if (email && !emailRegex.test(email)) {
    return next(new AppError("Định dạng email không hợp lệ!", 400));
  }

  if (passWord && passWord.length < 6) {
    return next(new AppError("Mật khẩu phải có ít nhất 6 ký tự!", 400));
  }

  if (role && !["user", "admin"].includes(role)) {
    return next(new AppError("Role không hợp lệ! Chỉ chấp nhận: user, admin", 400));
  }

  if (sex && !["male", "female"].includes(sex)) {
    return next(new AppError("Giới tính không hợp lệ! Chỉ chấp nhận: male, female", 400));
  }

  next();
};

export const validateUpdatePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError("Thiếu mật khẩu hiện tại hoặc mật khẩu mới", 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError("Mật khẩu mới phải có ít nhất 6 ký tự!", 400));
  }

  next();
};

export const validateUpdateProfile = (req, res, next) => {
  const { email, sex, address, addresses } = req.body;

  if (email && !emailRegex.test(email)) {
    return next(new AppError("Định dạng email không hợp lệ!", 400));
  }

  if (sex && !["male", "female"].includes(sex)) {
    return next(new AppError("Giới tính không hợp lệ! Chỉ chấp nhận: male, female", 400));
  }

  // Validate address elements if provided
  const incomingAddr = addresses
    ? Array.isArray(addresses)
      ? addresses
      : [addresses]
    : address
    ? [address]
    : [];

  if (incomingAddr.length > 0) {
    const first = incomingAddr[0];
    if (first.phone && !phoneRegex.test(first.phone)) {
      return next(new AppError("Số điện thoại trong địa chỉ không hợp lệ! Phải có từ 9 đến 11 chữ số.", 400));
    }
  }

  next();
};

export const validateUserIdParam = (req, res, next) => {
  const { id } = req.params;
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("ID người dùng không hợp lệ", 400));
  }
  next();
};
