/**
 * Consent Service
 * Quản lý sự đồng thuận thu thập dữ liệu hành vi của người dùng (GDPR/Privacy Compliance).
 */

import trackingApi from "../api/trackingApi";

const CONSENT_KEY = "webfashion_tracking_consent";

let inMemoryConsent = "granted";

export const consentService = {
  /**
   * Lấy trạng thái đồng thuận hiện tại ('granted' | 'denied')
   */
  getConsent() {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (saved === "granted" || saved === "denied") {
        return saved;
      }
      return "granted"; // Mặc định đồng thuận
    } catch {
      return inMemoryConsent;
    }
  },

  /**
   * Kiểm tra người dùng có cho phép tracking không
   */
  isTrackingAllowed() {
    return this.getConsent() === "granted";
  },

  /**
   * Cập nhật trạng thái đồng thuận và đồng bộ lên server
   * @param {'granted' | 'denied'} status
   */
  async setConsent(status) {
    if (status !== "granted" && status !== "denied") {
      throw new Error("Invalid consent status: must be 'granted' or 'denied'");
    }

    try {
      localStorage.setItem(CONSENT_KEY, status);
    } catch {
      inMemoryConsent = status;
    }

    try {
      await trackingApi.updateConsent(status);
    } catch (err) {
      console.warn("[ConsentService] Đồng bộ trạng thái consent lên server thất bại:", err?.message);
    }

    return status;
  },
};

export default consentService;
