import { AppError } from "../../common/exceptions/AppError.js";

export const validateCreateBanner = (req, res, next) => {
  const data = req.body;
  const errors = [];

  if (!data.title || String(data.title).trim() === "") {
    errors.push("Tiêu đề (title) không được để trống");
  }
  if (!data.imageUrl || String(data.imageUrl).trim() === "") {
    errors.push("Đường dẫn hình ảnh (imageUrl) không được để trống");
  }
  if (!data.position || String(data.position).trim() === "") {
    errors.push("Vị trí hiển thị (position) không được để trống");
  }

  // Parse and validate numeric sortOrder
  if (data.sortOrder !== undefined && data.sortOrder !== "") {
    const parsedSort = Number(data.sortOrder);
    if (isNaN(parsedSort) || parsedSort < 0) {
      errors.push("Thứ tự hiển thị (sortOrder) phải là số lớn hơn hoặc bằng 0");
    } else {
      req.body.sortOrder = parsedSort; // mutate to number
    }
  }

  // Date validations
  if (!data.startDate) {
    errors.push("Ngày bắt đầu (startDate) không được để trống");
  }
  if (!data.endDate) {
    errors.push("Ngày kết thúc (endDate) không được để trống");
  }
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (isNaN(start.getTime())) {
      errors.push("Ngày bắt đầu không đúng định dạng");
    } else {
      req.body.startDate = start; // mutate to Date
    }
    if (isNaN(end.getTime())) {
      errors.push("Ngày kết thúc không đúng định dạng");
    } else {
      req.body.endDate = end; // mutate to Date
    }
    if (start >= end) {
      errors.push("Ngày kết thúc phải lớn hơn ngày bắt đầu");
    }
  }

  // Target type and targetId validations
  const targetType = data.targetType || "external";
  if (!["product", "category", "external"].includes(targetType)) {
    errors.push("Kiểu liên kết (targetType) không hợp lệ");
  } else {
    req.body.targetType = targetType;
  }

  if (targetType === "product" && (!data.targetId || String(data.targetId).trim() === "")) {
    errors.push("Mã sản phẩm liên kết (targetId) là bắt buộc khi targetType là product");
  }
  if (targetType === "category" && (!data.targetId || String(data.targetId).trim() === "")) {
    errors.push("Mã danh mục liên kết (targetId) là bắt buộc khi targetType là category");
  }
  if (targetType === "external" && (!data.linkUrl || String(data.linkUrl).trim() === "")) {
    errors.push("Đường dẫn liên kết ngoài (linkUrl) là bắt buộc khi targetType là external");
  }

  if (data.isActive !== undefined) {
    req.body.isActive = String(data.isActive) === "true" || data.isActive === true;
  }

  if (errors.length > 0) {
    return next(new AppError(`Dữ liệu không hợp lệ: ${errors.join(". ")}`, 400));
  }

  next();
};

export const validateUpdateBanner = (req, res, next) => {
  const data = req.body;
  const errors = [];

  if (data.title !== undefined && String(data.title).trim() === "") {
    errors.push("Tiêu đề (title) không được để trống");
  }
  if (data.imageUrl !== undefined && String(data.imageUrl).trim() === "") {
    errors.push("Đường dẫn hình ảnh (imageUrl) không được để trống");
  }
  if (data.position !== undefined && String(data.position).trim() === "") {
    errors.push("Vị trí hiển thị (position) không được để trống");
  }

  if (data.sortOrder !== undefined && data.sortOrder !== "") {
    const parsedSort = Number(data.sortOrder);
    if (isNaN(parsedSort) || parsedSort < 0) {
      errors.push("Thứ tự hiển thị (sortOrder) phải là số lớn hơn hoặc bằng 0");
    } else {
      req.body.sortOrder = parsedSort;
    }
  }

  // Date validation
  if (data.startDate !== undefined || data.endDate !== undefined) {
    const start = data.startDate ? new Date(data.startDate) : null;
    const end = data.endDate ? new Date(data.endDate) : null;

    if (start) {
      if (isNaN(start.getTime())) {
        errors.push("Ngày bắt đầu không đúng định dạng");
      } else {
        req.body.startDate = start;
      }
    }
    if (end) {
      if (isNaN(end.getTime())) {
        errors.push("Ngày kết thúc không đúng định dạng");
      } else {
        req.body.endDate = end;
      }
    }
  }

  // Target type validation
  if (data.targetType !== undefined) {
    if (!["product", "category", "external"].includes(data.targetType)) {
      errors.push("Kiểu liên kết (targetType) không hợp lệ");
    }
  }

  if (data.isActive !== undefined) {
    req.body.isActive = String(data.isActive) === "true" || data.isActive === true;
  }

  if (errors.length > 0) {
    return next(new AppError(`Dữ liệu không hợp lệ: ${errors.join(". ")}`, 400));
  }

  next();
};
