import jwt from "jsonwebtoken";
import User from "../modules/users/user.model.js";
import { isAccessValid } from "../modules/auth/auth.redis.service.js";

const extractBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
};

const verifyAccessToken = async (token) => {
  const decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const tokenValid = await isAccessValid(decodedUser.jti, decodedUser.userId);

  if (!tokenValid) {
    const error = new Error("Access token has been revoked or is not whitelisted");
    error.name = "RevokedAccessTokenError";
    throw error;
  }

  return decodedUser;
};

export const protectedRoute = async (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Khong tim thay access token",
    });
  }

  try {
    req.user = await verifyAccessToken(token);
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(403).json({
        success: false,
        message: "Access token het han hoac khong dung!",
      });
    }

    if (error.name === "RevokedAccessTokenError") {
      return res.status(403).json({
        success: false,
        message: "Access token da bi thu hoi hoac khong hop le!",
      });
    }

    console.error("Loi khi xac minh JWT trong auth.middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Loi he thong",
    });
  }
};

export const optionalProtectedRoute = async (req, _res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = await verifyAccessToken(token);
  } catch (error) {
    req.user = null;
  }

  return next();
};

export const adminOnly = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Khong tim thay access token hop le",
      });
    }

    const user = await User.findById(userId).select("role");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Nguoi dung khong ton tai!",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Ban khong co quyen truy cap",
      });
    }

    req.user.role = user.role;
    return next();
  } catch (error) {
    console.error("Loi khi kiem tra quyen admin:", error);
    return res.status(500).json({
      success: false,
      message: "Loi he thong",
    });
  }
};

export const noAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy access token hợp lệ",
      });
    }

    const user = await User.findById(userId).select("role");
    if (user && user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Quản trị viên không được phép thực hiện chức năng mua hàng và thanh toán",
      });
    }

    return next();
  } catch (error) {
    console.error("Lỗi khi kiểm tra quyền admin trong noAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

