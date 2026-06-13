import { AppError } from "../../common/exceptions/AppError.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateSignUp = (req, res, next) => {
  const { email, passWord, firstName, lastName } = req.body;

  if (!email || !passWord || !firstName || !lastName) {
    return next(new AppError("Không thể thiếu passWord, lastName, firstName, email!", 400));
  }

  if (!emailRegex.test(email)) {
    return next(new AppError("Định dạng email không hợp lệ!", 400));
  }

  if (passWord.length < 6) {
    return next(new AppError("Mật khẩu phải có ít nhất 6 ký tự!", 400));
  }

  next();
};

export const validateSignIn = (req, res, next) => {
  const { email, passWord } = req.body;

  if (!email || !passWord) {
    return next(new AppError("Thiếu email hoặc password", 400));
  }

  if (!emailRegex.test(email)) {
    return next(new AppError("Định dạng email không hợp lệ!", 400));
  }

  next();
};

export const validateSendOTP = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email required", 400));
  }

  if (!emailRegex.test(email)) {
    return next(new AppError("Định dạng email không hợp lệ!", 400));
  }

  next();
};

export const validateVerifyOTP = (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError("Thiếu email hoặc OTP", 400));
  }

  if (!emailRegex.test(email)) {
    return next(new AppError("Định dạng email không hợp lệ!", 400));
  }

  next();
};

export const validateResetPassword = (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return next(new AppError("Thiếu dữ liệu reset password", 400));
  }

  if (!emailRegex.test(email)) {
    return next(new AppError("Định dạng email không hợp lệ!", 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError("Mật khẩu mới phải có ít nhất 6 ký tự!", 400));
  }

  next();
};
