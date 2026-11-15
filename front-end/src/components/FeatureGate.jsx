import React from "react";
import useFeatureFlags from "../hooks/useFeatureFlags";

/**
 * FeatureGate conditionally renders children if the specified feature flag is enabled.
 * If disabled, renders fallback (or null).
 */
export const FeatureGate = ({ flag, fallback = null, children }) => {
  const { isFeatureEnabled } = useFeatureFlags();

  if (!isFeatureEnabled(flag)) {
    return fallback;
  }

  return <>{children}</>;
};

export default FeatureGate;
