import jwt from "jsonwebtoken";
import User from "../modules/users/user.model.js";
import { isAccessValid, whitelistAccess, blacklistToken } from "../modules/auth/auth.redis.service.js";

export const protectedRoute = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy access token",
      });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodeUser) => {
      if (err) {
        console.error("JWT Verify Error:", err.message);
        return res.status(403).json({
          success: false,
          message: "Access token hết hạn hoặc không đúng!",
        });
      }

      // Verify token via Redis service (whitelist & blacklist)
      const tokenValid = await isAccessValid(decodeUser.jti);
      if (!tokenValid) {
        return res.status(403).json({
          success: false,
          message: "Access token đã bị thu hồi hoặc không hợp lệ!",
        });
      }

      req.user = decodeUser;
      next();
    });
  } catch (error) {
    console.error("Lỗi khi xác minh JWT trong auth.middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

export const optionalProtectedRoute = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodeUser) => {
      if (err) {
        req.user = null;
        return next();
      }

      // Verify access token whitelist in Redis
      const whitelistUser = await redis.get(`at:${decodeUser.jti}`);
      if (!whitelistUser || whitelistUser !== String(decodeUser.userId)) {
        req.user = null;
        return next();
      }

      req.user = decodeUser;
      next();
    });
  } catch (error) {
    req.user = null;
    next();
  }
};

export const adminOnly = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy access token hợp lệ",
      });
    }

    const user = await User.findById(userId).select("role");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại!",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập",
      });
    }

    next();
  } catch (error) {
    console.error("Lỗi khi kiểm tra quyền admin:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};
