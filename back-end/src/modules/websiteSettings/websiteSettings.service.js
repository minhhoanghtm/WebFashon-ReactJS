import websiteSettingsRepository from "./websiteSettings.repository.js";
import { AppError } from "../../common/exceptions/AppError.js";

class WebsiteSettingsService {
  async getSettings() {
    let settings = await websiteSettingsRepository.findOne({ singletonKey: "default" });
    if (!settings) {
      // Auto-initialize the default singleton document
      settings = await websiteSettingsRepository.create({
        singletonKey: "default",
        general: {
          siteName: "Web Fashion",
          siteDescription: "Cửa hàng thời trang cao cấp",
          logoUrl: "",
          faviconUrl: "",
          hotline: "0900000000",
          email: "contact@404Studio.com",
          address: "Thành phố Hồ Chí Minh, Việt Nam",
          workingHours: "8:00 - 22:00",
        },
        system: {
          maintenanceMode: false,
          maintenanceMessage: "Hệ thống đang được nâng cấp để mang đến trải nghiệm tốt hơn. Quý khách vui lòng quay lại sau ít phút.",
          maintenanceUntil: null,
          allowGuestCheckout: false,
          enableVoucher: true,
          enableReviews: true,
        },
      });
    }
    return settings;
  }

  async updateSettings(adminId, updateData) {
    const sanitizedData = { ...updateData };
    delete sanitizedData._id;
    delete sanitizedData.id;
    delete sanitizedData.createdAt;
    delete sanitizedData.updatedAt;
    delete sanitizedData.__v;
    delete sanitizedData.singletonKey;
    delete sanitizedData.createdBy;

    // Use dot notation for nested objects to merge updates safely
    const updateOps = { updatedBy: adminId };
    for (const [key, val] of Object.entries(sanitizedData)) {
      if (
        val &&
        typeof val === "object" &&
        !Array.isArray(val) &&
        !(val instanceof Date) &&
        key !== "homeContent"
      ) {
        for (const [subKey, subVal] of Object.entries(val)) {
          updateOps[`${key}.${subKey}`] = subVal;
        }
      } else {
        updateOps[key] = val;
      }
    }

    let settings = await websiteSettingsRepository.findOne({ singletonKey: "default" });
    if (!settings) {
      settings = await websiteSettingsRepository.create({
        ...sanitizedData,
        singletonKey: "default",
        createdBy: adminId,
        updatedBy: adminId,
      });
    } else {
      settings = await websiteSettingsRepository.findOneAndUpdate(
        { singletonKey: "default" },
        { $set: updateOps },
        { new: true }
      );
    }
    return settings;
  }
}

export default new WebsiteSettingsService();
