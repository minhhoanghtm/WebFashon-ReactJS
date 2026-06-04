export const successResponse = (res, data, message = "Thành công", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res, message = "Đã xảy ra lỗi", statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
