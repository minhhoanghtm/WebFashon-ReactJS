import { useEffect } from "react";
import { useWebsiteSettingsStore } from "../store/websiteSettings.store";
import { toast } from "react-toastify";

export const useWebsiteSettings = () => {
  const { 
    settings, 
    originalSettings, 
    setSettings, 
    loading, 
    saving, 
    fetched, 
    fetchSettings, 
    updateSettings: storeUpdateSettings 
  } = useWebsiteSettingsStore();

  useEffect(() => {
    if (!fetched) {
      fetchSettings();
    }
  }, [fetched, fetchSettings]);

  const updateSettings = async (updatedData) => {
    try {
      await storeUpdateSettings(updatedData);
      toast.success("Cập nhật cài đặt website thành công! 🎉");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật cài đặt");
      return false;
    }
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  return {
    settings,
    setSettings,
    loading,
    saving,
    isDirty,
    updateSettings,
    reload: () => fetchSettings(true),
  };
};

export default useWebsiteSettings;
