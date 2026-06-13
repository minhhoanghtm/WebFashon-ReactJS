import WebsiteSettings from "./websiteSettings.model.js";

class WebsiteSettingsRepository {
  async findOne(query = { singletonKey: "default" }) {
    return await WebsiteSettings.findOne(query);
  }

  async create(settingsData) {
    return await WebsiteSettings.create(settingsData);
  }

  async findOneAndUpdate(query = { singletonKey: "default" }, updateData, options = { new: true }) {
    return await WebsiteSettings.findOneAndUpdate(query, updateData, options);
  }
}

export default new WebsiteSettingsRepository();
