import { create } from 'zustand';
import { getWebsiteSettingsService, updateWebsiteSettingsService } from '../services/websiteSettings.service';

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
    } catch (err) {
      console.error("Lỗi khi tải cài đặt website:", err);
    } finally {
      set({ loading: false });
    }
  },

  setSettings: (settings) => set({ settings }),
  
  updateSettings: async (updatedData) => {
    set({ saving: true });
    try {
      const res = await updateWebsiteSettingsService(updatedData);
      set({ 
        settings: res, 
        originalSettings: JSON.parse(JSON.stringify(res)),
        fetched: true 
      });
      return true;
    } catch (err) {
      throw err;
    } finally {
      set({ saving: false });
    }
  }
}));
