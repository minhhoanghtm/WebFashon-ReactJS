/**
 * Session Management Service
 * Quản lý phiên làm việc của người dùng với cơ chế sliding inactivity window (30 phút).
 * Lưu trữ phiên trong sessionStorage và tự động nhận diện thiết bị/ngữ cảnh duyệt web.
 */

const SESSION_ID_KEY = "webfashion_session_id";
const SESSION_LAST_ACTIVE_KEY = "webfashion_session_last_active";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 phút

let inMemorySessionId = null;
let inMemoryLastActive = 0;

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

export const sessionService = {
  /**
   * Lấy sessionId hiện tại, tạo mới nếu đã hết hạn (> 30 phút không hoạt động)
   * @returns {{ sessionId: string, isNewSession: boolean }}
   */
  getSession() {
    const now = Date.now();
    try {
      let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
      const lastActiveStr = sessionStorage.getItem(SESSION_LAST_ACTIVE_KEY);
      const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : 0;

      const isExpired = !sessionId || !lastActive || now - lastActive > SESSION_TIMEOUT_MS;

      if (isExpired) {
        sessionId = generateUUID();
        sessionStorage.setItem(SESSION_ID_KEY, sessionId);
        sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());
        return { sessionId, isNewSession: true };
      }

      // Gia hạn sliding window
      sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());
      return { sessionId, isNewSession: false };
    } catch {
      // Fallback khi private browsing chặn sessionStorage
      const isExpired = !inMemorySessionId || now - inMemoryLastActive > SESSION_TIMEOUT_MS;
      if (isExpired) {
        inMemorySessionId = generateUUID();
        inMemoryLastActive = now;
        return { sessionId: inMemorySessionId, isNewSession: true };
      }
      inMemoryLastActive = now;
      return { sessionId: inMemorySessionId, isNewSession: false };
    }
  },

  /**
   * Lấy Session ID hiện hành
   */
  getSessionId() {
    return this.getSession().sessionId;
  },

  /**
   * Reset phiên làm việc (khi đăng xuất hoặc reset dữ liệu)
   */
  resetSession() {
    const newSessionId = generateUUID();
    const now = Date.now();
    try {
      sessionStorage.setItem(SESSION_ID_KEY, newSessionId);
      sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());
    } catch {
      inMemorySessionId = newSessionId;
      inMemoryLastActive = now;
    }
    return newSessionId;
  },

  /**
   * Lấy context môi trường của phiên (thiết bị, đường dẫn, nguồn truy cập)
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

    return {
      deviceType,
      referrer: typeof document !== "undefined" ? document.referrer || "" : "",
      pathname: typeof window !== "undefined" ? window.location.pathname || "/" : "/",
    };
  },
};

export default sessionService;
