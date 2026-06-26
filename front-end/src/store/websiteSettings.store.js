import { create } from 'zustand';
import { getWebsiteSettingsService, updateWebsiteSettingsService } from '../services/websiteSettings.service';

const updateFavicon = (logoUrl) => {
  if (!logoUrl) return;
  let faviconLink = document.querySelector("link[rel~='icon']");
  if (!faviconLink) {
    faviconLink = document.createElement("link");
    faviconLink.rel = "icon";
    document.getElementsByTagName("head")[0].appendChild(faviconLink);
  }
  faviconLink.type = "image/png";
  faviconLink.href = logoUrl;
};

export const useWebsiteSettingsStore = create((set, get) => ({
  settings: null,
  originalSettings: null,
  loading: false,
  saving: false,
  fetched: false,

  fetchSettings: async (force = false) => {
    if (get().fetched && !force && get().settings) return;
    set({ loading: true });
    try {
      const data = await getWebsiteSettingsService();
      set({ 
        settings: data, 
        originalSettings: JSON.parse(JSON.stringify(data)),
        fetched: true 
      });
      if (data?.general?.logoUrl) {
        updateFavicon(data.general.logoUrl);
      }
    } catch (err) {
      console.error("Lỗi khi tải cài đặt website:", err);
    } finally {
      set({ loading: false });
    }
  },

  setSettings: (newSettings) => {
    const settings = typeof newSettings === 'function' ? newSettings(get().settings) : newSettings;
    set({ settings });
    if (settings?.general?.logoUrl) {
      updateFavicon(settings.general.logoUrl);
    }
  },
  
  updateSettings: async (updatedData) => {
    set({ saving: true });
    try {
      const res = await updateWebsiteSettingsService(updatedData);
      set({ 
        settings: res, 
        originalSettings: JSON.parse(JSON.stringify(res)),
        fetched: true 
      });
      if (res?.general?.logoUrl) {
        updateFavicon(res.general.logoUrl);
      }
      return true;
    } catch (err) {
      throw err;
    } finally {
      set({ saving: false });
    }
  }
}));
