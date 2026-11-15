import React, { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import trackingService from "../services/tracking.service";
import sessionService from "../services/session.service";
import presenceService from "../services/presence.service";

/**
 * Component tự động quan sát hành trình chuyển trang trong React Single Page Application (SPA)
 * - Chống đếm trùng khi React StrictMode và React re-render
 * - Đo lường chính xác thời gian lưu lại (dwell time), thời gian tương tác (active time)
 * - Ghi nhận fromPath -> toPath, navigationType (PUSH, REPLACE, POP / Back-Forward)
 */
export const NavigationTracker = () => {
  const location = useLocation();
  const navigationType = useNavigationType(); // "PUSH" | "REPLACE" | "POP"
  const isFirstMount = useRef(true);
  const currentPathRef = useRef(location.pathname);

  useEffect(() => {
    const newPath = location.pathname;

    if (isFirstMount.current) {
      isFirstMount.current = false;
      currentPathRef.current = newPath;
      sessionService.updateRoute(newPath);

      // Bắt đầu trang đầu tiên
      trackingService.trackPageEnter(newPath, { initial: true });
      trackingService.trackPageView(newPath, { initial: true });
      return;
    }

    if (newPath === currentPathRef.current) {
      return;
    }

    const previousPath = currentPathRef.current;
    currentPathRef.current = newPath;

    // 1. Thu thập thời gian đã ở trên trang cũ trước khi rời đi
    const timings = presenceService.consumePageTimings();

    // 2. Phát sự kiện rời trang cũ (page_leave) kèm timing metrics
    trackingService.trackPageLeave(previousPath, timings, {
      destination: newPath,
    });

    // 3. Cập nhật route trong session service & presence service ngay lập tức
    sessionService.updateRoute(newPath);
    presenceService.updateRoute(newPath, previousPath);

    // 4. Phát hiện browser back / forward
    if (navigationType === "POP") {
      trackingService.track("browser_back", {
        fromPath: previousPath,
        toPath: newPath,
        meta: { popstate: true },
      });
    }

    // 5. Ghi nhận route_changed
    trackingService.trackRouteChanged(previousPath, newPath, navigationType.toLowerCase(), {
      timings,
    });

    // 6. Ghi nhận page_enter & page_view trang mới
    trackingService.trackPageEnter(newPath, {
      fromPath: previousPath,
    });
    trackingService.trackPageView(newPath, {
      fromPath: previousPath,
    });
  }, [location.pathname, navigationType]);

  return null;
};

export default NavigationTracker;