/**
 * Session Management & Identity Service
 * Quản lý phiên làm việc đa tab, định danh người dùng, nguồn truy cập (Traffic Source)
 * và tương quan hành động (Action/Trace Correlation).
 * 404 Studio — WebFashion
 */

import { USER_ACTIVITY_CONFIG } from "../config/activityConfig";

const SESSION_ID_KEY = "webfashion_session_id";
const SESSION_LAST_ACTIVE_KEY = "webfashion_session_last_active";
const TAB_ID_KEY = "webfashion_tab_id";
const FIRST_TOUCH_KEY = "webfashion_first_touch";
const SESSION_TOUCH_KEY = "webfashion_session_touch";

let inMemorySessionId = null;
let inMemoryTabId = null;
let inMemoryLastActive = 0;
let currentActionId = null;
let currentActionName = null;
let currentRoute = typeof window !== "undefined" ? window.location.pathname || "/" : "/";
let previousRoute = null;

const generateUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Làm sạch và loại bỏ token hoặc thông tin nhạy cảm trong query parameters
 */
const sanitizeQueryParams = (searchStr) => {
  if (!searchStr) return {};
  try {
    const params = new URLSearchParams(searchStr);
    const sanitized = {};
    const sensitiveKeys = [
      "token",
      "access_token",
      "refresh_token",
      "jwt",
      "password",
      "secret",
      "otp",
      "code",
      "auth",
      "auth_token",
    ];

    for (const [key, value] of params.entries()) {
      const lowerKey = key.toLowerCase();
      if (!sensitiveKeys.some((s) => lowerKey.includes(s))) {
        sanitized[key] = value.slice(0, 150); // Giới hạn độ dài an toàn
      }
    }
    return sanitized;
  } catch {
    return {};
  }
};

/**
 * Phân tích nguồn truy cập (Traffic Source, Referrer, UTM Attribution)
 */
const extractTrafficSource = () => {
  if (typeof window === "undefined") {
    return {
      channel: "Direct / Unknown",
      entrySource: "Direct / Unknown",
      referrer: null,
      referrerOrigin: null,
      utm: {},
      landingPage: "/",
    };
  }

  const landingPage = window.location.pathname + window.location.search;
  const rawReferrer = document.referrer || "";
  let referrerOrigin = null;
  let referrerDomain = "";

  if (rawReferrer) {
    try {
      const parsed = new URL(rawReferrer);
      referrerOrigin = parsed.origin;
      referrerDomain = parsed.hostname.toLowerCase();
    } catch {
      referrerOrigin = rawReferrer.slice(0, 100);
    }
  }

  // Kiểm tra nếu là chuyển trang nội bộ thì không phải nguồn truy cập từ bên ngoài
  const currentHost = window.location.hostname.toLowerCase();
  const isInternalReferrer = referrerDomain && (referrerDomain === currentHost || referrerDomain.endsWith("." + currentHost));

  const queryParams = sanitizeQueryParams(window.location.search);
  const utm = {
    source: queryParams.utm_source || null,
    medium: queryParams.utm_medium || null,
    campaign: queryParams.utm_campaign || null,
    content: queryParams.utm_content || null,
    term: queryParams.utm_term || null,
  };

  let channel = "Direct / Unknown";
  let entrySource = "Direct / Unknown";

  if (utm.source) {
    entrySource = utm.source;
    const medium = (utm.medium || "").toLowerCase();
    if (["cpc", "ppc", "paid", "ad", "ads"].includes(medium)) {
      channel = "Paid Campaign";
    } else if (["social", "post"].includes(medium)) {
      channel = "Paid / Social";
    } else {
      channel = "Campaign / External";
    }
  } else if (rawReferrer && !isInternalReferrer) {
    if (
      referrerDomain.includes("google.") ||
      referrerDomain.includes("bing.") ||
      referrerDomain.includes("yahoo.") ||
      referrerDomain.includes("duckduckgo.") ||
      referrerDomain.includes("coccoc.")
    ) {
      channel = "Organic Search";
      entrySource = referrerDomain.includes("google")
        ? "Google"
        : referrerDomain.includes("bing")
        ? "Bing"
        : referrerDomain.includes("coccoc")
        ? "CocCoc"
        : "Search Engine";
    } else if (
      referrerDomain.includes("facebook.") ||
      referrerDomain.includes("instagram.") ||
      referrerDomain.includes("tiktok.") ||
      referrerDomain.includes("t.co") ||
      referrerDomain.includes("twitter.") ||
      referrerDomain.includes("x.com") ||
      referrerDomain.includes("zalo.") ||
      referrerDomain.includes("youtube.") ||
      referrerDomain.includes("pinterest.")
    ) {
      channel = "Social Media";
      entrySource = referrerDomain.includes("facebook")
        ? "Facebook"
        : referrerDomain.includes("tiktok")
        ? "TikTok"
        : referrerDomain.includes("instagram")
        ? "Instagram"
        : referrerDomain.includes("zalo")
        ? "Zalo"
        : "Social Network";
    } else {
      channel = "Referral";
      entrySource = referrerDomain;
    }
  } else {
    // Không có referrer hoặc bị Referrer-Policy của trình duyệt ẩn
    channel = "Direct / Unknown";
    entrySource = "Direct / Unknown";
  }

  return {
    channel,
    entrySource,
    referrer: isInternalReferrer ? null : rawReferrer.slice(0, 500),
    referrerOrigin: isInternalReferrer ? null : referrerOrigin,
    utm,
    landingPage,
  };
};

export const sessionService = {
  /**
   * Lấy hoặc khởi tạo tabId (Duy nhất cho từng tab trình duyệt)
   */
  getTabId() {
    if (typeof window === "undefined") return "tab-srv";
    try {
      let tabId = sessionStorage.getItem(TAB_ID_KEY);
      if (!tabId) {
        tabId = "tab-" + generateUUID().slice(0, 8);
        sessionStorage.setItem(TAB_ID_KEY, tabId);
      }
      return tabId;
    } catch {
      if (!inMemoryTabId) {
        inMemoryTabId = "tab-" + generateUUID().slice(0, 8);
      }
      return inMemoryTabId;
    }
  },

  /**
   * Lấy hoặc tạo sessionId dùng chung cho các tab trong cùng trình duyệt
   * với sliding window 30 phút không hoạt động
   */
  getSession() {
    const now = Date.now();
    const timeout = USER_ACTIVITY_CONFIG.sessionTimeoutMs;

    try {
      let sessionId = localStorage.getItem(SESSION_ID_KEY);
      const lastActiveStr = localStorage.getItem(SESSION_LAST_ACTIVE_KEY);
      const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : 0;

      const isExpired = !sessionId || !lastActive || now - lastActive > timeout;

      if (isExpired) {
        sessionId = "sess-" + generateUUID();
        localStorage.setItem(SESSION_ID_KEY, sessionId);
        localStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());

        // Ghi nhận session touch attribution mới
        const traffic = extractTrafficSource();
        sessionStorage.setItem(SESSION_TOUCH_KEY, JSON.stringify(traffic));

        // Nếu chưa từng có first-touch attribution thì lưu vĩnh viễn
        if (!localStorage.getItem(FIRST_TOUCH_KEY)) {
          localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(traffic));
        }

        return { sessionId, isNewSession: true };
      }

      // Gia hạn sliding window
      localStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());
      return { sessionId, isNewSession: false };
    } catch {
      const isExpired = !inMemorySessionId || now - inMemoryLastActive > timeout;
      if (isExpired) {
        inMemorySessionId = "sess-" + generateUUID();
        inMemoryLastActive = now;
        return { sessionId: inMemorySessionId, isNewSession: true };
      }
      inMemoryLastActive = now;
      return { sessionId: inMemorySessionId, isNewSession: false };
    }
  },

  getSessionId() {
    return this.getSession().sessionId;
  },

  /**
   * Reset phiên làm việc (khi đăng xuất hoặc reset)
   */
  resetSession() {
    const newSessionId = "sess-" + generateUUID();
    const now = Date.now();
    try {
      localStorage.setItem(SESSION_ID_KEY, newSessionId);
      localStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());
    } catch {
      inMemorySessionId = newSessionId;
      inMemoryLastActive = now;
    }
    return newSessionId;
  },

  /**
   * Quản lý Action Correlation (User Action -> API Request -> Result)
   */
  startAction(actionName) {
    currentActionId = "act-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
    currentActionName = actionName;
    return currentActionId;
  },

  getCurrentActionId() {
    return currentActionId;
  },

  getCurrentActionName() {
    return currentActionName;
  },

  clearAction() {
    currentActionId = null;
    currentActionName = null;
  },

  /**
   * Tạo Trace ID chuẩn cho các yêu cầu HTTP
   */
  createTraceId() {
    return "trc-" + generateUUID().replace(/-/g, "").slice(0, 16);
  },

  /**
   * Cập nhật điều hướng trang trong SPA
   */
  updateRoute(newPath) {
    if (newPath !== currentRoute) {
      previousRoute = currentRoute;
      currentRoute = newPath;
    }
    return { currentRoute, previousRoute };
  },

  getCurrentRoute() {
    return currentRoute;
  },

  getPreviousRoute() {
    return previousRoute;
  },

  /**
   * Lấy Attribution & Traffic Source của phiên
   */
  getAttribution() {
    try {
      const sessionTouchRaw = sessionStorage.getItem(SESSION_TOUCH_KEY);
      if (sessionTouchRaw) {
        return JSON.parse(sessionTouchRaw);
      }
    } catch { /* Referrer storage is optional in private browsing. */ }
    return extractTrafficSource();
  },

  getFirstTouchAttribution() {
    try {
      const firstTouchRaw = localStorage.getItem(FIRST_TOUCH_KEY);
      if (firstTouchRaw) {
        return JSON.parse(firstTouchRaw);
      }
    } catch { /* Referrer storage is optional in private browsing. */ }
    return extractTrafficSource();
  },

  /**
   * Lấy context môi trường đầy đủ của phiên
   */
  getSessionContext() {
    let deviceType = "desktop";
    const width = typeof window !== "undefined" ? window.innerWidth : 1200;
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

    if (/iPad|Tablet/i.test(ua) || (width >= 768 && width <= 1024)) {
      deviceType = "tablet";
    } else if (/Mobi|Android|iPhone/i.test(ua) || width < 768) {
      deviceType = "mobile";
    }

    const traffic = this.getAttribution();

    return {
      deviceType,
      tabId: this.getTabId(),
      sessionId: this.getSessionId(),
      pathname: currentRoute,
      fromPath: previousRoute,
      entrySource: traffic.entrySource,
      trafficChannel: traffic.channel,
      referrer: traffic.referrer,
      referrerOrigin: traffic.referrerOrigin,
      utm: traffic.utm,
    };
  },
};

export default sessionService;
