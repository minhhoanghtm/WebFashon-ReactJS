import { useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import trackingService from "../services/tracking.service";
import sessionService from "../services/session.service";
import consentService from "../services/consent.service";
import presenceService from "../services/presence.service";

/**
 * Custom Hook tích hợp tracking toàn diện cho React Components & Layouts
 * - Quản lý vòng đời trang SPA: page_enter, page_view, page_leave, route_changed
 * - Chống đếm trùng khi StrictMode và React re-render
 * - Cung cấp helper functions cho tương tác người dùng, giỏ hàng, checkout, AI assistant
 */
export function useTracking(options = { autoTrackPageView: false }) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isMountedRef = useRef(false);
  const lastPathRef = useRef(location.pathname);

  useEffect(() => {
    if (!options.autoTrackPageView) return;

    const currentPath = location.pathname;

    if (!isMountedRef.current) {
      isMountedRef.current = true;
      lastPathRef.current = currentPath;
      sessionService.updateRoute(currentPath);

      trackingService.trackPageEnter(currentPath, { initial: true });
      trackingService.trackPageView(currentPath, { initial: true });
      return;
    }

    if (currentPath === lastPathRef.current) return;

    const previousPath = lastPathRef.current;
    lastPathRef.current = currentPath;

    // 1. Thu thập thời gian đã ở trên trang cũ
    const timings = presenceService.consumePageTimings();

    // 2. Ghi nhận sự kiện rời trang cũ
    trackingService.trackPageLeave(previousPath, timings, {
      destination: currentPath,
    });

    // 3. Cập nhật route
    sessionService.updateRoute(currentPath);

    // 4. Ghi nhận browser back/forward nếu là sự kiện POP
    if (navigationType === "POP") {
      trackingService.track("browser_back", {
        fromPath: previousPath,
        toPath: currentPath,
      });
    }

    // 5. Ghi nhận route_changed & trang mới
    trackingService.trackRouteChanged(previousPath, currentPath, navigationType.toLowerCase(), {
      timings,
    });
    trackingService.trackPageEnter(currentPath, {
      fromPath: previousPath,
    });
    trackingService.trackPageView(currentPath, {
      fromPath: previousPath,
    });
  }, [location.pathname, navigationType, options.autoTrackPageView]);

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

  const startAction = useCallback((actionName, meta) => {
    return sessionService.startAction(actionName, meta);
  }, []);

  const endAction = useCallback(() => {
    sessionService.clearAction();
  }, []);

  const trackButtonClicked = useCallback((buttonName, meta) => {
    trackingService.trackButtonClicked(buttonName, meta);
  }, []);

  return {
    trackingService,
    sessionService,
    consentService,
    presenceService,
    trackEvent,
    trackProductClick,
    trackAddToCart,
    trackRemoveFromCart,
    trackCartQuantityChange,
    trackVariantSelect,
    trackRecommendationClick,
    startAction,
    endAction,
    trackButtonClicked,
  };
}

export default useTracking;