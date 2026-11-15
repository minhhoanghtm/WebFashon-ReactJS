import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import consentService, {
  CONSENT_STATUS,
  DEFAULT_CATEGORIES,
} from "../services/consent.service";
import trackingService from "../services/tracking.service";
import { toast } from "react-toastify";

const ConsentContext = createContext(null);

export const ConsentProvider = ({ children }) => {
  const [consentState, setConsentState] = useState(() => consentService.getState());
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(() => !consentService.hasUserConsented());

  useEffect(() => {
    // 1. Lắng nghe thay đổi từ consentService (bao gồm cả cross-tab qua storage event)
    const unsubscribe = consentService.subscribe((newState) => {
      setConsentState(newState);
      setIsBannerVisible(!consentService.hasUserConsented());
    });

    // 2. Thử đồng bộ trạng thái từ máy chủ
    consentService.syncWithServer();

    return () => {
      unsubscribe();
    };
  }, []);

  // Action: Chấp nhận tất cả
  const acceptAll = useCallback(async () => {
    try {
      const newState = await consentService.setConsentChoice(CONSENT_STATUS.ALL_ACCEPTED, null, "banner_accept_all");
      setConsentState(newState);
      setIsBannerVisible(false);
      setIsPreferencesOpen(false);

      // Ngay sau khi chấp nhận tất cả, kích hoạt tracking cho trang hiện tại
      if (typeof window !== "undefined") {
        trackingService.trackPageView(window.location.pathname);
      }
      toast.success("Đã lưu cài đặt quyền riêng tư: Chấp nhận tất cả.");
    } catch {
      toast.error("Có lỗi khi lưu lựa chọn. Vui lòng thử lại.");
    }
  }, []);

  // Action: Chỉ cần thiết
  const acceptEssentialOnly = useCallback(async () => {
    try {
      const newState = await consentService.setConsentChoice(CONSENT_STATUS.ESSENTIAL_ONLY, null, "banner_essential_only");
      setConsentState(newState);
      setIsBannerVisible(false);
      setIsPreferencesOpen(false);
      toast.info("Đã lưu cài đặt: Chỉ sử dụng cookie cần thiết.");
    } catch {
      toast.error("Có lỗi khi lưu lựa chọn. Vui lòng thử lại.");
    }
  }, []);

  // Action: Lưu tùy chỉnh
  const saveCustom = useCallback(async (categories) => {
    try {
      const newState = await consentService.setConsentChoice(CONSENT_STATUS.CUSTOM, categories, "modal_custom");
      setConsentState(newState);
      setIsBannerVisible(false);
      setIsPreferencesOpen(false);

      if (newState.categories.analytics && typeof window !== "undefined") {
        trackingService.trackPageView(window.location.pathname);
      }
      toast.success("Đã cập nhật tùy chọn quyền riêng tư thành công.");
    } catch {
      toast.error("Có lỗi khi lưu tùy chọn. Vui lòng thử lại.");
    }
  }, []);

  // Action: Rút lại quyền riêng tư (Withdraw)
  const withdrawConsent = useCallback(async () => {
    try {
      const newState = await consentService.setConsentChoice(CONSENT_STATUS.WITHDRAWN, null, "user_withdrawal");
      setConsentState(newState);
      setIsBannerVisible(false);
      setIsPreferencesOpen(false);
      toast.info("Đã thu hồi quyền đồng thuận không thiết yếu.");
    } catch {
      toast.error("Có lỗi khi thu hồi quyền riêng tư.");
    }
  }, []);

  const openPreferences = useCallback(() => {
    setIsPreferencesOpen(true);
  }, []);

  const closePreferences = useCallback(() => {
    setIsPreferencesOpen(false);
  }, []);

  const value = {
    consentState,
    hasConsented: consentService.hasUserConsented(),
    isBannerVisible,
    isPreferencesOpen,
    isAnalyticsAllowed: consentService.isAnalyticsAllowed(),
    isPersonalizationAllowed: consentService.isPersonalizationAllowed(),
    isMarketingAllowed: consentService.isMarketingAllowed(),
    acceptAll,
    acceptEssentialOnly,
    saveCustom,
    withdrawConsent,
    openPreferences,
    closePreferences,
  };

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
};

export const useConsent = () => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return context;
};

export default ConsentContext;
