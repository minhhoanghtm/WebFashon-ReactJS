/**
 * Comprehensive Consent & Privacy Service
 * 404 Studio WebFashion — GDPR & Privacy Compliance
 *
 * Quản lý trạng thái đồng thuận (Consent State Machine), lưu trữ cục bộ,
 * phát tín hiệu phản ứng (Event Emitter/Subscriber) và đồng bộ với Server.
 */

import privacyApi from "../api/privacyApi";
import trackingApi from "../api/trackingApi";

export const CONSENT_STORAGE_KEY = "webfashion_privacy_consent_v1";
export const LEGACY_CONSENT_KEY = "webfashion_tracking_consent";
// Loaded from GET /privacy/policy. The backend is the sole source of truth.
export let CURRENT_POLICY_VERSION = "__POLICY_VERSION_PENDING__";

export const CONSENT_STATUS = {
  UNKNOWN: "UNKNOWN",
  ESSENTIAL_ONLY: "ESSENTIAL_ONLY",
  CUSTOM: "CUSTOM",
  ALL_ACCEPTED: "ALL_ACCEPTED",
  WITHDRAWN: "WITHDRAWN",
  RECONSENT_REQUIRED: "RECONSENT_REQUIRED",
};

export const DEFAULT_CATEGORIES = {
  necessary: true,
  analytics: false,
  personalization: false,
  marketing: false,
};

let memoryState = null;
const listeners = new Set();

const parseStoredConsent = () => {
  if (typeof window === "undefined") {
    return {
      status: CONSENT_STATUS.UNKNOWN,
      categories: { ...DEFAULT_CATEGORIES },
      policyVersion: CURRENT_POLICY_VERSION,
      updatedAt: null,
      hasConsented: false,
    };
  }

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Kiểm tra phiên bản chính sách
      if (parsed.policyVersion !== CURRENT_POLICY_VERSION) {
        return {
          status: CONSENT_STATUS.RECONSENT_REQUIRED,
          categories: { ...DEFAULT_CATEGORIES },
          policyVersion: CURRENT_POLICY_VERSION,
          updatedAt: parsed.updatedAt || null,
          hasConsented: false,
        };
      }

      return {
        status: parsed.status || CONSENT_STATUS.UNKNOWN,
        categories: {
          necessary: true,
          analytics: Boolean(parsed.categories?.analytics),
          personalization: Boolean(parsed.categories?.personalization),
          marketing: Boolean(parsed.categories?.marketing),
        },
        policyVersion: parsed.policyVersion || CURRENT_POLICY_VERSION,
        updatedAt: parsed.updatedAt || null,
        hasConsented: parsed.hasConsented === true,
      };
    }
  } catch {
    // Fallback to memory
  }

  return {
    status: CONSENT_STATUS.UNKNOWN,
    categories: { ...DEFAULT_CATEGORIES },
    policyVersion: CURRENT_POLICY_VERSION,
    updatedAt: null,
    hasConsented: false,
  };
};

export const consentService = {
  async initializePolicyVersion() {
    try {
      const response = await privacyApi.getPolicy();
      const data = response?.data?.data || response?.data || response;
      if (!data?.version) throw new Error("Thiếu phiên bản chính sách");
      if (CURRENT_POLICY_VERSION !== data.version) {
        CURRENT_POLICY_VERSION = data.version;
        memoryState = parseStoredConsent();
        this.notifyListeners(memoryState);
      }
      return CURRENT_POLICY_VERSION;
    } catch (error) {
      console.warn("[ConsentService] Không thể tải phiên bản chính sách:", error?.message);
      return null;
    }
  },

  /**
   * Lấy toàn bộ trạng thái consent hiện tại
   */
  getState() {
    if (!memoryState) {
      memoryState = parseStoredConsent();
    }
    return { ...memoryState };
  },

  /**
   * Người dùng đã chủ động đưa ra lựa chọn hợp lệ chưa?
   */
  hasUserConsented() {
    const state = this.getState();
    return Boolean(state.hasConsented && state.status !== CONSENT_STATUS.UNKNOWN && state.status !== CONSENT_STATUS.RECONSENT_REQUIRED);
  },

  /**
   * Mục đích Strictly Necessary luôn được phép
   */
  isNecessaryAllowed() {
    return true;
  },

  /**
   * Kiểm tra xem Analytics Tracking có được cho phép không
   */
  isAnalyticsAllowed() {
    const state = this.getState();
    return this.hasUserConsented() && Boolean(state.categories?.analytics);
  },

  /**
   * Kiểm tra xem Personalization / AI Recommendation Profile có được cho phép không
   */
  isPersonalizationAllowed() {
    const state = this.getState();
    return this.hasUserConsented() && Boolean(state.categories?.personalization);
  },

  /**
   * Kiểm tra xem Marketing Pixels có được cho phép không
   */
  isMarketingAllowed() {
    const state = this.getState();
    return this.hasUserConsented() && Boolean(state.categories?.marketing);
  },

  /**
   * Helper tương thích ngược với Tracking SDK cũ
   */
  isTrackingAllowed() {
    return this.isAnalyticsAllowed();
  },

  /**
   * Helper tương thích ngược với interface getConsent() cũ
   * Trả về 'granted' nếu analytics được cho phép, ngược lại 'denied'
   */
  getConsent() {
    return this.isAnalyticsAllowed() ? "granted" : "denied";
  },

  /**
   * Đăng ký lắng nghe thay đổi trạng thái consent
   * @param {(state) => void} callback
   * @returns {() => void} unsubscribe
   */
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  /**
   * Phát sự kiện cho tất cả listeners nội bộ
   */
  notifyListeners(state) {
    listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.warn("[ConsentService] Listener error:", err);
      }
    });
  },

  /**
   * Lưu lựa chọn consent mới
   * @param {"ESSENTIAL_ONLY" | "CUSTOM" | "ALL_ACCEPTED" | "WITHDRAWN"} choice
   * @param {Object} [customCategories]
   * @param {string} [source="banner"]
   */
  async setConsentChoice(choice, customCategories = null, source = "banner") {
    let categories = { ...DEFAULT_CATEGORIES };
    let status = choice;

    if (choice === CONSENT_STATUS.ALL_ACCEPTED) {
      categories = {
        necessary: true,
        analytics: true,
        personalization: true,
        marketing: false, // 404 Studio không sử dụng third-party marketing pixels ngoài luồng
      };
    } else if (choice === CONSENT_STATUS.ESSENTIAL_ONLY || choice === CONSENT_STATUS.WITHDRAWN) {
      categories = {
        necessary: true,
        analytics: false,
        personalization: false,
        marketing: false,
      };
    } else if (choice === CONSENT_STATUS.CUSTOM) {
      categories = {
        necessary: true,
        analytics: Boolean(customCategories?.analytics),
        personalization: Boolean(customCategories?.personalization),
        marketing: Boolean(customCategories?.marketing),
      };
    }

    const newState = {
      status,
      categories,
      policyVersion: CURRENT_POLICY_VERSION,
      updatedAt: new Date().toISOString(),
      hasConsented: true,
      source,
    };

    memoryState = newState;

    // Lưu vào LocalStorage
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newState));
      // Đồng bộ key cũ để tương thích ngược
      localStorage.setItem(LEGACY_CONSENT_KEY, categories.analytics ? "granted" : "denied");
    } catch (err) {
      console.warn("[ConsentService] Không thể lưu LocalStorage:", err);
    }

    // Thông báo cho các services và components đang đăng ký (TrackingService, PresenceService, UI)
    this.notifyListeners(newState);

    // Đồng bộ lên máy chủ qua Privacy API
    try {
      await privacyApi.updateConsent({
        choice: status,
        categories,
        policyVersion: CURRENT_POLICY_VERSION,
        source,
      });
    } catch (apiErr) {
      console.warn("[ConsentService] Đồng bộ Consent API thất bại:", apiErr?.message);
      // Fallback sang endpoint /events/consent cũ
      try {
        await trackingApi.updateConsent(categories.analytics ? "granted" : "denied");
      } catch { console.warn("[ConsentService] Không thể đồng bộ endpoint consent cũ."); }
    }

    return newState;
  },

  /**
   * Tương thích ngược: setConsent('granted' | 'denied')
   */
  async setConsent(status) {
    if (status === "granted") {
      return this.setConsentChoice(CONSENT_STATUS.ALL_ACCEPTED);
    }
    return this.setConsentChoice(CONSENT_STATUS.ESSENTIAL_ONLY);
  },

  /**
   * Đồng bộ trạng thái consent từ máy chủ khi mount hoặc sau khi đăng nhập
   */
  async syncWithServer() {
    try {
      const res = await privacyApi.getConsent();
      if (res?.data?.success && res.data.data?.hasConsented) {
        const serverData = res.data.data;
        // Never revive consent that was given to an older policy version.
        // This guarantees a version bump keeps the banner visible.
        if (serverData.policyVersion !== CURRENT_POLICY_VERSION) {
          memoryState = parseStoredConsent();
          this.notifyListeners(memoryState);
          return;
        }
        const currentLocal = this.getState();

        // Nếu máy chủ có bản ghi đã đồng thuận và mới hơn hoặc local chưa có consent
        if (!currentLocal.hasConsented || (serverData.updatedAt && new Date(serverData.updatedAt) > new Date(currentLocal.updatedAt || 0))) {
          const syncedState = {
            status: serverData.choice || (serverData.analytics ? CONSENT_STATUS.ALL_ACCEPTED : CONSENT_STATUS.ESSENTIAL_ONLY),
            categories: {
              necessary: true,
              analytics: Boolean(serverData.analytics),
              personalization: Boolean(serverData.personalization),
              marketing: Boolean(serverData.marketing),
            },
            policyVersion: serverData.policyVersion || CURRENT_POLICY_VERSION,
            updatedAt: serverData.updatedAt || new Date().toISOString(),
            hasConsented: true,
          };

          memoryState = syncedState;
          try {
            localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(syncedState));
            localStorage.setItem(LEGACY_CONSENT_KEY, syncedState.categories.analytics ? "granted" : "denied");
          } catch { console.warn("[ConsentService] Không thể lưu consent đã đồng bộ."); }

          this.notifyListeners(syncedState);
        }
      }
    } catch {
      // Offline / unauthenticated / silent fallback
    }
  },
};

// Đăng ký lắng nghe storage event để đồng bộ giữa các tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === CONSENT_STORAGE_KEY) {
      try {
        memoryState = parseStoredConsent();
        consentService.notifyListeners(memoryState);
      } catch { console.warn("[ConsentService] Không thể cập nhật consent từ storage."); }
    }
  });
}

export default consentService;
