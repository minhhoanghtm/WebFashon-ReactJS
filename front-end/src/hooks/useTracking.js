import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import trackingService from "../services/tracking.service";
import sessionService from "../services/session.service";
import consentService from "../services/consent.service";

/**
 * Custom Hook tích hợp tracking cho React Components
 * - Tự động track page_view khi route thay đổi
 * - Cung cấp các hàm helper track tương tác UI
 */
export function useTracking(options = { autoTrackPageView: false }) {
  const location = useLocation();
  const lastLocationRef = useRef(null);

  useEffect(() => {
    if (options.autoTrackPageView && location.pathname !== lastLocationRef.current) {
      lastLocationRef.current = location.pathname;
      trackingService.trackPageView(location.pathname);
    }
  }, [location.pathname, options.autoTrackPageView]);

  const trackEvent = useCallback((eventType, payload) => {
    trackingService.track(eventType, payload);
  }, []);

  const trackProductClick = useCallback((product, meta) => {
    trackingService.trackProductClick(product, meta);
  }, []);

  const trackAddToCart = useCallback((product, quantity, variant) => {
    trackingService.trackAddToCart(product, quantity, variant);
  }, []);

  const trackRemoveFromCart = useCallback((product, quantity) => {
    trackingService.trackRemoveFromCart(product, quantity);
  }, []);

  const trackCartQuantityChange = useCallback((product, oldQty, newQty) => {
    trackingService.trackCartQuantityChange(product, oldQty, newQty);
  }, []);

  const trackVariantSelect = useCallback((product, variant, meta) => {
    trackingService.trackVariantSelect(product, variant, meta);
  }, []);

  const trackRecommendationClick = useCallback((product, algorithm, position) => {
    trackingService.trackRecommendationClick(product, algorithm, position);
  }, []);

  return {
    trackingService,
    sessionService,
    consentService,
    trackEvent,
    trackProductClick,
    trackAddToCart,
    trackRemoveFromCart,
    trackCartQuantityChange,
    trackVariantSelect,
    trackRecommendationClick,
  };
}

export default useTracking;
