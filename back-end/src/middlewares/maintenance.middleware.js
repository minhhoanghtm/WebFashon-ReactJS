import { getSystemSettings } from "../common/utils/featureFlags.js";
import jwt from "jsonwebtoken";
import User from "../modules/users/user.model.js";

const isExemptPath = (path) => {
  if (!path) return false;
  const p = path.toLowerCase();

  // Health and public settings
  if (p === "/health" || p.startsWith("/health/")) return true;
  if (p === "/settings" || p.startsWith("/settings/")) return true;

  // Essential auth routes so admin can log in / check session
  if (
    p === "/auth/login" ||
    p === "/auth/admin-login" ||
    p === "/auth/refresh" ||
    p === "/auth/refresh-token" ||
    p === "/auth/me" ||
    p === "/auth/logout"
  ) {
    return true;
  }

  // Admin routes
  if (p.startsWith("/admin") || p.includes("/admin/")) return true;

  // Payment webhooks & IPN callbacks
  if (p.startsWith("/payments") || p.includes("/payment/callback") || p.includes("/ipn")) {
    return true;
  }

  return false;
};

const checkIfAdminUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.split(" ")[1];
  if (!token) return false;

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decoded?.role === "admin") return true;

    // Verify against database in case role changed
    if (decoded?.userId) {
      const user = await User.findById(decoded.userId).select("role status").lean();
      if (user && user.status !== "blocked" && user.role === "admin") {
        return true;
      }
    }
  } catch (err) {
    return false;
  }
  return false;
};

export const maintenanceMiddleware = async (req, res, next) => {
  try {
    // Check if the current route is exempt
    if (isExemptPath(req.path)) {
      return next();
    }

    const settings = await getSystemSettings();
    if (!settings?.maintenanceMode) {
      return next();
    }

    // Maintenance mode is ON: allow admin through
    const isAdmin = await checkIfAdminUser(req);
    if (isAdmin) {
      return next();
    }

    // Reject non-admin with 503
    return res.status(503).json({
      success: false,
      code: "MAINTENANCE",
      message:
        settings.maintenanceMessage ||
        "Hệ thống đang được bảo trì. Vui lòng quay lại sau ít phút.",
      maintenanceUntil: settings.maintenanceUntil || null,
    });
  } catch (error) {
    console.error("Error in maintenanceMiddleware:", error);
    return next();
  }
};
