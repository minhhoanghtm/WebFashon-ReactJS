import { useEffect, useMemo, useCallback } from "react";
import { useWebsiteSettingsStore } from "../store/websiteSettings.store";
import { getAppSocket } from "../services/socket.service";

export const useFeatureFlags = () => {
  const { settings, loading, fetched, fetchSettings, setSettings } = useWebsiteSettingsStore();

  // Initial fetch if needed
  useEffect(() => {
    if (!fetched) {
      fetchSettings();
    }
  }, [fetched, fetchSettings]);

  // Window focus & periodic 60s background revalidation
  useEffect(() => {
    const handleFocus = () => {
      fetchSettings(true);
    };

    window.addEventListener("focus", handleFocus);
    const interval = setInterval(() => {
      fetchSettings(true);
    }, 60000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [fetchSettings]);

  // Listen to live WebSocket broadcast: "settings:updated"
  useEffect(() => {
    let socket;
    try {
      socket = getAppSocket();
      if (socket) {
        const onSettingsUpdated = (newSettings) => {
          if (newSettings) {
            setSettings(newSettings);
          }
        };
        socket.on("settings:updated", onSettingsUpdated);
        return () => {
          socket.off("settings:updated", onSettingsUpdated);
        };
      }
    } catch {
      // Ignore if socket unavailable
    }
  }, [setSettings]);

  // Listen to 503 MAINTENANCE event from axiosClient
  useEffect(() => {
    const handleMaintenanceEvent = (e) => {
      if (e.detail) {
        setSettings((prev) => ({
          ...prev,
          system: {
            ...(prev?.system || {}),
            maintenanceMode: true,
            maintenanceMessage: e.detail.message || prev?.system?.maintenanceMessage,
            maintenanceUntil: e.detail.maintenanceUntil || prev?.system?.maintenanceUntil,
          },
        }));
      }
    };

    window.addEventListener("maintenance:active", handleMaintenanceEvent);
    return () => {
      window.removeEventListener("maintenance:active", handleMaintenanceEvent);
    };
  }, [setSettings]);

  const flags = useMemo(() => {
    const sys = settings?.system || {};
    return {
      maintenanceMode: Boolean(sys.maintenanceMode),
      maintenanceMessage:
        sys.maintenanceMessage ||
        "Hệ thống đang được nâng cấp để mang đến trải nghiệm tốt hơn. Quý khách vui lòng quay lại sau ít phút.",
      maintenanceUntil: sys.maintenanceUntil || null,
      allowGuestCheckout: Boolean(sys.allowGuestCheckout),
      enableVoucher: sys.enableVoucher !== false,
      enableReviews: sys.enableReviews !== false,
    };
  }, [settings]);

  const isFeatureEnabled = useCallback(
    (featureKey) => {
      return Boolean(flags[featureKey]);
    },
    [flags]
  );

  return {
    flags,
    isFeatureEnabled,
    loading: loading && !fetched,
    refetch: () => fetchSettings(true),
  };
};

export default useFeatureFlags;
