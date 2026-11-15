import websiteSettingsService from "./websiteSettings.service.js";
import { successResponse } from "../../common/responses/index.js";
import { invalidateFeatureFlagsCache } from "../../common/utils/featureFlags.js";

const filterSettingsResponse = (settings, isAdmin = false) => {
  if (!settings) return null;
  const raw = typeof settings.toObject === "function" ? settings.toObject() : settings;
  const responseData = {
    id: raw._id || raw.id,
    general: {
      siteName: raw.general?.siteName || "",
      siteDescription: raw.general?.siteDescription || "",
      logoUrl: raw.general?.logoUrl || "",
      faviconUrl: raw.general?.faviconUrl || "",
      hotline: raw.general?.hotline || "",
      email: raw.general?.email || "",
      address: raw.general?.address || "",
      workingHours: raw.general?.workingHours || "",
    },
    seo: {
      metaTitle: raw.seo?.metaTitle || "",
      metaDescription: raw.seo?.metaDescription || "",
      metaKeywords: raw.seo?.metaKeywords || "",
      ogImage: raw.seo?.ogImage || "",
    },
    system: {
      maintenanceMode: Boolean(raw.system?.maintenanceMode),
      maintenanceMessage:
        raw.system?.maintenanceMessage ||
        "Hệ thống đang được nâng cấp để mang đến trải nghiệm tốt hơn. Quý khách vui lòng quay lại sau ít phút.",
      maintenanceUntil: raw.system?.maintenanceUntil || null,
      allowGuestCheckout: Boolean(raw.system?.allowGuestCheckout),
      enableVoucher: raw.system?.enableVoucher !== false,
      enableReviews: raw.system?.enableReviews !== false,
    },
    socialLinks: {
      facebook: raw.socialLinks?.facebook || "",
      instagram: raw.socialLinks?.instagram || "",
      tiktok: raw.socialLinks?.tiktok || "",
      youtube: raw.socialLinks?.youtube || "",
      zalo: raw.socialLinks?.zalo || "",
    },
    footer: {
      companyName: raw.footer?.companyName || "",
      taxCode: raw.footer?.taxCode || "",
      copyrightText: raw.footer?.copyrightText || "",
    },
    integrations: {
      facebookPixel: raw.integrations?.facebookPixel || "",
      googleAnalytics: raw.integrations?.googleAnalytics || "",
      googleTagManager: raw.integrations?.googleTagManager || "",
      chatbotScript: raw.integrations?.chatbotScript || "",
    },
    homeContent: raw.homeContent || {},
    updatedAt: raw.updatedAt,
  };

  if (isAdmin) {
    responseData.createdBy = raw.createdBy;
    responseData.updatedBy = raw.updatedBy;
  }
  return responseData;
};

export const getSettings = async (req, res, next) => {
  try {
    const settings = await websiteSettingsService.getSettings();
    const isAdmin = req.user?.role === "admin";
    const responseData = filterSettingsResponse(settings, isAdmin);
    return successResponse(res, responseData, "Lấy thông tin cài đặt thành công");
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const adminId = req.user?.userId;
    const settings = await websiteSettingsService.updateSettings(adminId, req.body);
    const responseData = filterSettingsResponse(settings, true);

    // Invalidate memory cache immediately
    invalidateFeatureFlagsCache();

    // Broadcast settings:updated to connected clients via Socket.IO
    try {
      const { getSocketIO } = await import("../../sockets/index.js");
      const io = getSocketIO();
      if (io) {
        io.emit("settings:updated", responseData);
      }
    } catch (wsErr) {
      // Non-fatal if socket is not initialized
    }

    return successResponse(res, responseData, "Cập nhật thông tin cài đặt thành công");
  } catch (error) {
    next(error);
  }
};
