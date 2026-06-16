import { useState, useEffect } from "react";
import { getWebsiteSettingsService, updateWebsiteSettingsService } from "../services/websiteSettings.service";
import { toast } from "react-toastify";

export const useWebsiteSettings = () => {
  const [settings, setSettings] = useState(null);
  const [originalSettings, setOriginalSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getWebsiteSettingsService();
      setSettings(data);
      setOriginalSettings(JSON.parse(JSON.stringify(data)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi tải cài đặt website");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (updatedData) => {
    try {
      setSaving(true);
      const res = await updateWebsiteSettingsService(updatedData);
      setSettings(res);
      setOriginalSettings(JSON.parse(JSON.stringify(res)));
      toast.success("Cập nhật cài đặt website thành công! 🎉");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật cài đặt");
      return false;
    } finally {
      setSaving(false);
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
    reload: fetchSettings,
  };
};

export default useWebsiteSettings;
