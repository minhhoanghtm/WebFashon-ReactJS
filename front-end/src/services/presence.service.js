/**
 * Real-Time User Presence & Idle State Machine
 * Quản lý trạng thái: ACTIVE, IDLE (60s), AWAY (300s "Treo trang"), BACKGROUND, PASSIVE_VIEWING, SESSION_ENDED.
 * Đo lường chính xác các xô thời gian (Active time, Idle time, Away time, Background time, Dwell time).
 * 404 Studio — WebFashion
 */

import { USER_ACTIVITY_CONFIG, PRESENCE_STATUS } from "../config/activityConfig";
import sessionService from "./session.service";
import consentService from "./consent.service";
import { ENV } from "../config/env";
import { tokenStorage } from "../utils/token";
import { getAnonymousId } from "../utils/anonymousId";

let currentStatus = PRESENCE_STATUS.ACTIVE;
let lastMeaningfulActivityAt = Date.now();
let lastInteractionThrottleAt = 0;
let lastHeartbeatAt = 0;
let stateStartedAt = Date.now();
let pageLoadedAt = Date.now();
let isPassiveViewing = false;

// Accumulators cho các xô thời gian trên trang hiện tại (ms)
const pageTimings = {
  activeMs: 0,
  idleMs: 0,
  awayMs: 0,
  backgroundMs: 0,
  passiveViewingMs: 0,
};

let heartbeatTimer = null;
let stateCheckTimer = null;
let listenersInitialized = false;
let transitionCallback = null;
let lastReportedAction = "page_load";
let lastReportedApi = null;

/**
 * Flush khoảng thời gian của trạng thái hiện tại vào accumulator
 */
const accumulateCurrentStateTime = () => {
  const now = Date.now();
  const elapsed = Math.max(0, now - stateStartedAt);
  stateStartedAt = now;

  if (document.visibilityState === "hidden") {
    pageTimings.backgroundMs += elapsed;
  } else if (isPassiveViewing) {
    pageTimings.passiveViewingMs += elapsed;
  } else {
    switch (currentStatus) {
      case PRESENCE_STATUS.ACTIVE:
        pageTimings.activeMs += elapsed;
        break;
      case PRESENCE_STATUS.IDLE:
        pageTimings.idleMs += elapsed;
        break;
      case PRESENCE_STATUS.AWAY:
        pageTimings.awayMs += elapsed;
        break;
      case PRESENCE_STATUS.BACKGROUND:
        pageTimings.backgroundMs += elapsed;
        break;
      default:
        break;
    }
  }
};

/**
 * Gửi nhịp tim Presence lên máy chủ Redis
 */
const sendHeartbeat = async (extraPayload = {}) => {
  if (typeof window === "undefined") return;
  if (!consentService.isAnalyticsAllowed()) return;

  const now = Date.now();
  lastHeartbeatAt = now;

  const idleDurationSec = Math.floor(Math.max(0, now - lastMeaningfulActivityAt) / 1000);
  const sessionDurationSec = Math.floor(Math.max(0, now - pageLoadedAt) / 1000);
  const attribution = sessionService.getAttribution();
  const consentState = consentService.getState();

  const payload = {
    session_id: sessionService.getSessionId(),
    tab_id: sessionService.getTabId(),
    anonymous_id: getAnonymousId(),
    status: currentStatus,
    current_route: sessionService.getCurrentRoute(),
    previous_route: sessionService.getPreviousRoute(),
    idle_duration_sec: idleDurationSec,
    session_duration_sec: sessionDurationSec,
    entry_source: attribution.entrySource,
    traffic_channel: attribution.channel,
    last_action: lastReportedAction,
    last_api: lastReportedApi,
    visible: document.visibilityState !== "hidden",
    consent_status: consentState.status,
    timestamp: now,
    ...extraPayload,
  };

  try {
    const apiUrl = `${ENV.API_BASE_URL}/events/presence/heartbeat`;
    const headers = {
      "Content-Type": "application/json",
      "x-session-id": payload.session_id,
      "x-tab-id": payload.tab_id,
      "x-anonymous-id": payload.anonymous_id,
    };
    const token = tokenStorage.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Sử dụng fetch với keepalive gọn nhẹ, không block luồng
    fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Không ném lỗi ra ngoài
  }
};

/**
 * Gửi tín hiệu đóng tab / rời trang qua sendBeacon
 */
const sendLeaveBeacon = (reason = "tab_close") => {
  if (typeof window === "undefined" || !navigator.sendBeacon) return;
  if (!consentService.isAnalyticsAllowed()) return;
  accumulateCurrentStateTime();

  const apiUrl = `${ENV.API_BASE_URL}/events/presence/leave`;
  const payload = {
    session_id: sessionService.getSessionId(),
    tab_id: sessionService.getTabId(),
    reason,
    final_timings: {
      ...pageTimings,
      dwellMs: Date.now() - pageLoadedAt,
    },
  };

  try {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon(apiUrl, blob);
  } catch { /* Beacon is a best-effort unload signal. */ }
};

/**
 * Đổi trạng thái và phát sự kiện chuyển trạng thái
 */
const transitionTo = (newStatus, reason = "") => {
  if (currentStatus === newStatus) return;

  accumulateCurrentStateTime();
  const oldStatus = currentStatus;
  currentStatus = newStatus;

  // Gọi callback cho tracking service phát analytics transition event
  if (transitionCallback) {
    transitionCallback({
      oldStatus,
      newStatus,
      reason,
      idleDurationSec: Math.floor((Date.now() - lastMeaningfulActivityAt) / 1000),
      timestamp: Date.now(),
    });
  }

  // Gửi heartbeat cập nhật ngay trạng thái mới lên Redis
  sendHeartbeat();
};

/**
 * Định kỳ kiểm tra đồng hồ không hoạt động (Inactivity Timer)
 */
const checkInactivityState = () => {
  if (typeof document === "undefined") return;

  const now = Date.now();

  // 1. Kiểm tra trạng thái Background (chuyển tab hoặc thu nhỏ trình duyệt)
  if (document.visibilityState === "hidden") {
    if (currentStatus !== PRESENCE_STATUS.BACKGROUND) {
      transitionTo(PRESENCE_STATUS.BACKGROUND, "tab_hidden");
    }
    return;
  }

  // 2. Kiểm tra nếu đang phát nội dung đa phương tiện
  if (isPassiveViewing) {
    if (currentStatus !== PRESENCE_STATUS.PASSIVE_VIEWING) {
      transitionTo(PRESENCE_STATUS.PASSIVE_VIEWING, "media_playing");
    }
    return;
  }

  const inactiveElapsed = now - lastMeaningfulActivityAt;

  // 3. Quá 30 phút -> Kết thúc phiên
  if (inactiveElapsed >= USER_ACTIVITY_CONFIG.sessionTimeoutMs) {
    if (currentStatus !== PRESENCE_STATUS.SESSION_ENDED) {
      transitionTo(PRESENCE_STATUS.SESSION_ENDED, "session_timeout_30m");
    }
    return;
  }

  // 4. Quá 300 giây (5 phút) -> Treo trang / Không thao tác (AWAY)
  if (inactiveElapsed >= USER_ACTIVITY_CONFIG.awayAfterMs) {
    if (currentStatus !== PRESENCE_STATUS.AWAY) {
      transitionTo(PRESENCE_STATUS.AWAY, "inactive_300s");
    }
    return;
  }

  // 5. Quá 60 giây -> Không hoạt động (IDLE)
  if (inactiveElapsed >= USER_ACTIVITY_CONFIG.idleAfterMs) {
    if (currentStatus !== PRESENCE_STATUS.IDLE) {
      transitionTo(PRESENCE_STATUS.IDLE, "inactive_60s");
    }
    return;
  }

  // 6. Dưới 60 giây -> Đang hoạt động (ACTIVE)
  if (currentStatus !== PRESENCE_STATUS.ACTIVE) {
    transitionTo(PRESENCE_STATUS.ACTIVE, "meaningful_interaction");
  }
};

/**
 * Ghi nhận tương tác có ý nghĩa của người dùng (Throttled)
 */
const handleMeaningfulInteraction = (actionName = "user_interaction") => {
  const now = Date.now();
  if (now - lastInteractionThrottleAt < USER_ACTIVITY_CONFIG.interactionThrottleMs) {
    return;
  }
  lastInteractionThrottleAt = now;
  lastMeaningfulActivityAt = now;
  lastReportedAction = actionName;

  // Nếu người dùng đang IDLE hoặc AWAY mà thao tác lại -> Trở lại ACTIVE ngay
  if (
    currentStatus === PRESENCE_STATUS.IDLE ||
    currentStatus === PRESENCE_STATUS.AWAY ||
    currentStatus === PRESENCE_STATUS.PASSIVE_VIEWING
  ) {
    transitionTo(PRESENCE_STATUS.ACTIVE, "resumed_by_" + actionName);
  }
};

export const presenceService = {
  /**
   * Khởi động bộ lắng nghe hiện diện toàn cục
   */
  init(options = {}) {
    if (typeof window === "undefined" || listenersInitialized) return;
    listenersInitialized = true;

    if (options.onTransition) {
      transitionCallback = options.onTransition;
    }

    // 1. Đăng ký các sự kiện tương tác người dùng có ý nghĩa
    const interactionEvents = ["pointerdown", "click", "touchstart"];
    interactionEvents.forEach((evName) => {
      window.addEventListener(evName, () => handleMeaningfulInteraction(evName), {
        passive: true,
      });
    });

    // Bàn phím: Chỉ ghi nhận timestamp tương tác, TUYỆT ĐỐI không đọc event.key hay giá trị
    window.addEventListener(
      "keydown",
      () => handleMeaningfulInteraction("keydown_press"),
      { passive: true }
    );

    // Scroll: Throttled do người dùng cuộn
    window.addEventListener(
      "scroll",
      () => handleMeaningfulInteraction("user_scroll"),
      { passive: true }
    );

    // Form controls change
    window.addEventListener(
      "change",
      () => handleMeaningfulInteraction("form_change"),
      { passive: true }
    );

    // 2. Lắng nghe thay đổi hiển thị trang (Visibility Change / Tab Switch)
    document.addEventListener("visibilitychange", () => {
      accumulateCurrentStateTime();
      if (document.visibilityState === "hidden") {
        transitionTo(PRESENCE_STATUS.BACKGROUND, "tab_switch_background");
      } else {
        // Khi người dùng quay lại tab, tính toán lại trạng thái dựa trên thời gian trôi qua
        checkInactivityState();
      }
    });

    // 3. Lắng nghe thẻ video phát/dừng (Passive viewing)
    document.addEventListener(
      "play",
      (e) => {
        if (e.target && e.target.tagName === "VIDEO") {
          isPassiveViewing = true;
          checkInactivityState();
        }
      },
      true
    );

    document.addEventListener(
      "pause",
      (e) => {
        if (e.target && e.target.tagName === "VIDEO") {
          isPassiveViewing = false;
          checkInactivityState();
        }
      },
      true
    );

    document.addEventListener(
      "ended",
      (e) => {
        if (e.target && e.target.tagName === "VIDEO") {
          isPassiveViewing = false;
          checkInactivityState();
        }
      },
      true
    );

    // 4. Lắng nghe đóng tab / chuyển trang
    window.addEventListener("pagehide", () => sendLeaveBeacon("pagehide"));
    window.addEventListener("beforeunload", () => sendLeaveBeacon("beforeunload"));

    // 5. Chu kỳ kiểm tra trạng thái mỗi 1 giây
    stateCheckTimer = setInterval(checkInactivityState, 1000);

    // 6. Gửi heartbeat mỗi 30 giây
    heartbeatTimer = setInterval(sendHeartbeat, USER_ACTIVITY_CONFIG.heartbeatIntervalMs);

    // 7. Lắng nghe thay đổi trạng thái đồng thuận Cookie
    consentService.subscribe((state) => {
      if (consentService.isAnalyticsAllowed()) {
        sendHeartbeat({ consent_status: state?.status });
      }
    });

    // Gửi nhịp tim ban đầu khi vừa nạp trang
    sendHeartbeat({ initial: true });
  },

  /**
   * Cập nhật tức thời khi người dùng chuyển trang (SPA Navigation)
   */
  updateRoute(newPath, previousPath = null) {
    if (!newPath) return;
    accumulateCurrentStateTime();
    sendHeartbeat({
      current_route: newPath,
      previous_route: previousPath || sessionService.getPreviousRoute(),
      last_action: `nav_${newPath.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30)}`,
    });
  },

  /**
   * Cập nhật API vừa gọi để hiển thị correlation trên Admin
   */
  reportApiCall(endpoint) {
    if (endpoint) {
      lastReportedApi = endpoint.slice(0, 150);
    }
  },

  /**
   * Cập nhật hành động người dùng vừa thực hiện
   */
  reportAction(actionName) {
    handleMeaningfulInteraction(actionName);
  },

  /**
   * Lấy trạng thái presence hiện tại
   */
  getStatus() {
    return currentStatus;
  },

  /**
   * Lấy số giây người dùng đang không thao tác
   */
  getIdleSeconds() {
    return Math.floor(Math.max(0, Date.now() - lastMeaningfulActivityAt) / 1000);
  },

  /**
   * Lấy tổng hợp các xô thời gian của trang hiện tại và reset cho trang mới
   */
  consumePageTimings() {
    accumulateCurrentStateTime();
    const now = Date.now();
    const totalDwellMs = Math.max(0, now - pageLoadedAt);

    const snapshot = {
      dwellMs: totalDwellMs,
      activeMs: pageTimings.activeMs,
      idleMs: pageTimings.idleMs,
      awayMs: pageTimings.awayMs,
      backgroundMs: pageTimings.backgroundMs,
      passiveViewingMs: pageTimings.passiveViewingMs,
    };

    // Reset lại cho trang mới
    pageLoadedAt = now;
    stateStartedAt = now;
    pageTimings.activeMs = 0;
    pageTimings.idleMs = 0;
    pageTimings.awayMs = 0;
    pageTimings.backgroundMs = 0;
    pageTimings.passiveViewingMs = 0;

    return snapshot;
  },

  /**
   * Lấy bản sao thời gian hiện tại mà không reset
   */
  getCurrentPageTimings() {
    accumulateCurrentStateTime();
    return {
      dwellMs: Math.max(0, Date.now() - pageLoadedAt),
      activeMs: pageTimings.activeMs,
      idleMs: pageTimings.idleMs,
      awayMs: pageTimings.awayMs,
      backgroundMs: pageTimings.backgroundMs,
      passiveViewingMs: pageTimings.passiveViewingMs,
    };
  },

  /**
   * Tách danh tính khi đăng xuất và khởi tạo session mới
   */
  async handleLogout() {
    if (typeof window === "undefined") return;
    try {
      const apiUrl = `${ENV.API_BASE_URL}/events/presence/disassociate`;
      const payload = {
        session_id: sessionService.getSessionId(),
        tab_id: sessionService.getTabId(),
      };
      await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": payload.session_id,
          "x-tab-id": payload.tab_id,
        },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch { /* Final presence signal is best-effort. */ }
    // Khởi tạo session ID mới cho hoạt động kế tiếp của khách
    sessionService.startNewSession?.();
  },

  /**
   * Dọn dẹp timers khi cần
   */
  destroy() {
    if (stateCheckTimer) clearInterval(stateCheckTimer);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    listenersInitialized = false;
  },
};

export default presenceService;
