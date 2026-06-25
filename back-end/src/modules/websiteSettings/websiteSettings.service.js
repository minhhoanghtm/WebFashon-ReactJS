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
          allowGuestCheckout: true,
          enableVoucher: true,
          enableReviews: true,
        },
      });
    }
    return settings;
  }

  async updateSettings(adminId, updateData) {
    let settings = await websiteSettingsRepository.findOne({ singletonKey: "default" });
    if (!settings) {
      settings = await websiteSettingsRepository.create({
        ...updateData,
        singletonKey: "default",
        createdBy: adminId,
        updatedBy: adminId,
      });
    } else {
      settings = await websiteSettingsRepository.findOneAndUpdate(
        { singletonKey: "default" },
        { ...updateData, updatedBy: adminId },
        { new: true }
      );
    }
    return settings;
  }
}

export default new WebsiteSettingsService();
