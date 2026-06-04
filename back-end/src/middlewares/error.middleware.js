export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  console.error("🔥 ERROR DETECTED:", err);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "Dữ liệu";
    err.statusCode = 409;
    err.message = `${field} đã được sử dụng!`;
    err.isOperational = true;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((el) => el.message);
    err.statusCode = 400;
    err.message = `Dữ liệu không hợp lệ: ${messages.join(". ")}`;
    err.isOperational = true;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    err.statusCode = 400;
    err.message = `Giá trị ${err.value} không đúng định dạng cho trường ${err.path}`;
    err.isOperational = true;
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    err.statusCode = 401;
    err.message = "Token không hợp lệ. Vui lòng đăng nhập lại.";
    err.isOperational = true;
  }

  if (err.name === "TokenExpiredError") {
    err.statusCode = 401;
    err.message = "Token đã hết hạn. Vui lòng đăng nhập lại.";
    err.isOperational = true;
  }

  // Development response
  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  // Operational error
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // General server error
  return res.status(500).json({
    success: false,
    message: "Đã xảy ra lỗi hệ thống!",
  });
};
export default errorHandler;
