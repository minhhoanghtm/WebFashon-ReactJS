import { isFeatureEnabled } from "../common/utils/featureFlags.js";

/**
 * Middleware to require a specific feature flag to be enabled.
 * If disabled, responds with 403 FEATURE_DISABLED.
 */
export const requireFeature = (featureKey, customMessage) => {
  return async (req, res, next) => {
    try {
      const enabled = await isFeatureEnabled(featureKey);
      if (!enabled) {
        return res.status(403).json({
          success: false,
          code: "FEATURE_DISABLED",
          message:
            customMessage ||
            `Tính năng ${featureKey} hiện đang tạm đóng. Vui lòng thử lại sau.`,
        });
      }
      return next();
    } catch (err) {
      console.error(`Error checking feature flag ${featureKey}:`, err);
      return next();
    }
  };
};
