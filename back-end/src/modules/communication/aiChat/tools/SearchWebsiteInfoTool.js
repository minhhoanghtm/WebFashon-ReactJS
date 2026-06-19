import websiteSettingsService from "../../../websiteSettings/websiteSettings.service.js";

export class SearchWebsiteInfoTool {
  name = "search_website_info";

  async execute() {
    return websiteSettingsService.getSettings?.() || {};
  }
}
