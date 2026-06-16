import { AppError } from "../../common/exceptions/AppError.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateUpdateSettings = (req, res, next) => {
  const data = req.body;
  const errors = [];

  if (!data.general) {
    errors.push("Thiếu thông tin cấu hình chung (general)");
    return next(new AppError(`Dữ liệu không hợp lệ: ${errors.join(". ")}`, 400));
  }

  const { siteName, email, hotline, address } = data.general;

  if (!siteName || String(siteName).trim() === "") {
    errors.push("Tên website (siteName) không được để trống");
  }
  if (!email || String(email).trim() === "") {
    errors.push("Email liên hệ không được để trống");
  } else if (!emailRegex.test(email)) {
    errors.push("Email liên hệ không đúng định dạng");
  }
  if (!hotline || String(hotline).trim() === "") {
    errors.push("Hotline không được để trống");
  }
  if (!address || String(address).trim() === "") {
    errors.push("Địa chỉ không được để trống");
  }

  // Parse integration fields if they exist
  if (data.system) {
    req.body.system.maintenanceMode = data.system.maintenanceMode !== undefined ? (String(data.system.maintenanceMode) === "true" || data.system.maintenanceMode === true) : undefined;
    req.body.system.allowGuestCheckout = data.system.allowGuestCheckout !== undefined ? (String(data.system.allowGuestCheckout) === "true" || data.system.allowGuestCheckout === true) : undefined;
    req.body.system.enableVoucher = data.system.enableVoucher !== undefined ? (String(data.system.enableVoucher) === "true" || data.system.enableVoucher === true) : undefined;
    req.body.system.enableReviews = data.system.enableReviews !== undefined ? (String(data.system.enableReviews) === "true" || data.system.enableReviews === true) : undefined;
  }

  if (errors.length > 0) {
    return next(new AppError(`Dữ liệu không hợp lệ: ${errors.join(". ")}`, 400));
  }

  next();
};
