import WebsiteSettings from "../../modules/websiteSettings/websiteSettings.model.js";

let cachedSystemSettings = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 25 * 1000; // 25 seconds (<= 30s requirement)

/**
 * Get the latest system settings with a short in-memory cache.
 */
export const getSystemSettings = async (forceFresh = false) => {
  const now = Date.now();
  if (!forceFresh && cachedSystemSettings && now < cacheExpiry) {
    return cachedSystemSettings;
  }

  try {
    const doc = await WebsiteSettings.findOne({ singletonKey: "default" }).lean();
    if (doc?.system) {
      cachedSystemSettings = {
        maintenanceMode: Boolean(doc.system.maintenanceMode),
        maintenanceMessage: doc.system.maintenanceMessage || "Hệ thống đang được nâng cấp để mang đến trải nghiệm tốt hơn. Quý khách vui lòng quay lại sau ít phút.",
        maintenanceUntil: doc.system.maintenanceUntil || null,
        allowGuestCheckout: Boolean(doc.system.allowGuestCheckout),
        enableVoucher: doc.system.enableVoucher !== false,
        enableReviews: doc.system.enableReviews !== false,
      };
    } else {
      cachedSystemSettings = {
        maintenanceMode: false,
        maintenanceMessage: "Hệ thống đang được nâng cấp để mang đến trải nghiệm tốt hơn. Quý khách vui lòng quay lại sau ít phút.",
        maintenanceUntil: null,
        allowGuestCheckout: false,
        enableVoucher: true,
        enableReviews: true,
      };
    }
  } catch (err) {
    console.error("Failed to fetch system settings in featureFlags:", err.message);
    if (!cachedSystemSettings) {
      cachedSystemSettings = {
        maintenanceMode: false,
        maintenanceMessage: "Hệ thống đang được nâng cấp để mang đến trải nghiệm tốt hơn. Quý khách vui lòng quay lại sau ít phút.",
        maintenanceUntil: null,
        allowGuestCheckout: false,
        enableVoucher: true,
        enableReviews: true,
      };
    }
  }

  cacheExpiry = now + CACHE_TTL_MS;
  return cachedSystemSettings;
};

/**
 * Check if a specific feature flag is enabled.
 * Supported keys: 'maintenanceMode', 'allowGuestCheckout', 'enableVoucher', 'enableReviews'
 */
export const isFeatureEnabled = async (featureKey) => {
  const settings = await getSystemSettings();
  return Boolean(settings[featureKey]);
};

/**
 * Invalidate the cache (called on settings update).
 */
export const invalidateFeatureFlagsCache = () => {
  cachedSystemSettings = null;
  cacheExpiry = 0;
};
