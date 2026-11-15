import axios from 'axios';
import { ENV } from '../config/env';
import { tokenStorage } from '../utils/token';
import { useAuthStore } from '../store/auth.store';
import { getAnonymousId, getAnonymousToken } from '../utils/anonymousId';
import sessionService from '../services/session.service';
import presenceService from '../services/presence.service';

const cleanUrls = (obj) => {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    if (obj.startsWith('/uploads/')) {
      const backendUrl = ENV.API_BASE_URL.replace("/api", "");
      return `${backendUrl}${obj}`;
    }
    const uploadsIndex = obj.indexOf("/uploads/");
    if (uploadsIndex !== -1 && (obj.startsWith("http://404studio.website") || obj.startsWith("https://404studio.website"))) {
      const filename = obj.substring(uploadsIndex + "/uploads/".length);
      const backendUrl = ENV.API_BASE_URL.replace("/api", "");
      return `${backendUrl}/uploads/${filename}`;
    }
    return obj;
  }
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(cleanUrls);
    }
    const proto = Object.getPrototypeOf(obj);
    if (proto === null || proto === Object.prototype) {
      const cleaned = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cleaned[key] = cleanUrls(obj[key]);
        }
      }
      return cleaned;
    }
  }
  return obj;
};

const axiosClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Single-flight refresh token promise & Multi-tab broadcast channel
let activeRefreshPromise = null;
let authBroadcastChannel = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    authBroadcastChannel = new BroadcastChannel('webfashion_auth_sync');
    authBroadcastChannel.onmessage = (event) => {
      const data = event.data;
      if (data?.type === 'TOKEN_REFRESHED' && data.token) {
        const currentToken = tokenStorage.getToken();
        if (currentToken !== data.token) {
          tokenStorage.setToken(data.token);
          const currentUser = useAuthStore.getState().user;
          useAuthStore.getState().login(data.token, currentUser);
        }
      } else if (data?.type === 'LOGOUT') {
        tokenStorage.removeToken();
        useAuthStore.getState().logout();
      }
    };
  } catch {
    authBroadcastChannel = null;
  }
}

/**
 * Single-flight Refresh Token Manager:
 * Ensures all concurrent 401s and proactive refresh checks reuse the exact same in-flight HTTP request.
 * Completely eliminates race conditions, token reuse false positives, and multi-tab logout loops.
 */
export const requestNewAccessToken = async () => {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const storedRefreshToken = tokenStorage.getRefreshToken?.() || null;
      const refreshResponse = await axios.post(
        `${ENV.API_BASE_URL}/auth/refreshToken`,
        storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
        { withCredentials: true, timeout: 15000 }
      );

      const respData = refreshResponse.data?.data || refreshResponse.data;
      const newAccessToken = respData?.accessToken;
      const newRefreshToken = respData?.refreshToken;

      if (!newAccessToken) {
        throw new Error("No access token returned from refresh endpoint");
      }

      tokenStorage.setToken(newAccessToken);
      if (newRefreshToken && tokenStorage.setRefreshToken) {
        tokenStorage.setRefreshToken(newRefreshToken);
      }

      const currentUser = useAuthStore.getState().user;
      useAuthStore.getState().login(newAccessToken, currentUser);

      // Notify other tabs immediately
      if (authBroadcastChannel) {
        try {
          authBroadcastChannel.postMessage({
            type: 'TOKEN_REFRESHED',
            token: newAccessToken,
          });
        } catch { /* Cross-tab notification is best-effort. */ }
      }

      return newAccessToken;
    } catch (refreshError) {
      const status = refreshError.response?.status;
      // ONLY trigger forced logout when the backend explicitly rejects the refresh token as invalid/expired (401/403)
      if (status === 401 || status === 403) {
        tokenStorage.removeToken();
        useAuthStore.getState().logout();

        if (authBroadcastChannel) {
          try {
            authBroadcastChannel.postMessage({ type: 'LOGOUT' });
          } catch { /* Cross-tab notification is best-effort. */ }
        }

        if (typeof window !== 'undefined') {
          const pathname = window.location.pathname;
          if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
            window.location.href = '/login';
          }
        }
      } else {
        // Network error (ECONNRESET, timeout), 500, 502, 503, 504:
        // PRESERVE user credentials and auth state — DO NOT LOG OUT!
        console.warn("[axiosClient] Token refresh failed due to temporary network/server error:", refreshError.message);
      }
      throw refreshError;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
};

// Request interceptor to dynamically inject the JWT bearer token with safe proactive renewal
axiosClient.interceptors.request.use(
  async (config) => {
    // Avoid recursion: do not run refresh logic on the refreshToken endpoint itself!
    if (config.url && config.url.includes('/auth/refreshToken')) {
      return config;
    }

    let token = tokenStorage.getToken();
    if (token) {
      const decoded = tokenStorage.decodeToken(token);
      if (decoded && decoded.exp) {
        const expirationTime = decoded.exp * 1000;
        const currentTime = Date.now();

        // If the token expires in less than 2 minutes (120,000 ms), proactively refresh it in background
        if (expirationTime - currentTime < 2 * 60 * 1000) {
          try {
            const freshToken = await requestNewAccessToken();
            config.headers.Authorization = `Bearer ${freshToken}`;
            return config;
          } catch {
            // Proactive renewal error: proceed with current token and let standard 401 response interceptor handle if needed
          }
        }
      }

      // Inject bearer token
      const currentToken = tokenStorage.getToken();
      if (currentToken && config.headers) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
    }

    const anonymousId = getAnonymousId();
    if (anonymousId && config.headers) {
      config.headers['x-anonymous-id'] = anonymousId;
    }

    const anonymousToken = getAnonymousToken();
    if (anonymousToken && config.headers) {
      config.headers['x-anonymous-token'] = anonymousToken;
    }

    // Gắn thông tin phiên làm việc, nhãn tab, traceId và actionId để tương quan API
    if (config.headers) {
      config._startTime = Date.now();
      const traceId = sessionService.createTraceId();
      config.headers['x-trace-id'] = traceId;
      config.headers['x-session-id'] = sessionService.getSessionId();
      config.headers['x-tab-id'] = sessionService.getTabId();
      config.headers['x-frontend-route'] = sessionService.getCurrentRoute();
      const actionId = sessionService.getCurrentActionId();
      if (actionId) {
        config.headers['x-action-id'] = actionId;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    try {
      const config = response.config || {};
      const durationMs = config._startTime ? Date.now() - config._startTime : 0;
      const cleanUrl = config.url ? config.url.replace(ENV.API_BASE_URL, '') : '';
      const isObservabilityEndpoint =
        cleanUrl.includes('/events') ||
        cleanUrl.includes('/tracking') ||
        cleanUrl.includes('/presence') ||
        cleanUrl.includes('/privacy') ||
        cleanUrl.includes('/health');

      if (!isObservabilityEndpoint) {
        presenceService.reportApiCall(cleanUrl);
      }
      if (durationMs >= 5000 && !isObservabilityEndpoint && typeof window !== 'undefined' && window.trackingService) {
        window.trackingService.track('api_slow', {
          meta: {
            endpoint: cleanUrl,
            durationMs,
            status: response.status,
            actionId: config.headers?.['x-action-id'] || null,
          },
        });
      }
    } catch { /* Request metadata is optional. */ }

    // Return standard success response data (typically { success: true, data: ..., message: ... })
    if (response && response.data) {
      response.data = cleanUrls(response.data);
    }
    return response.data;
  },
  async (error) => {
    try {
      const config = error.config || {};
      const durationMs = config._startTime ? Date.now() - config._startTime : 0;
      const cleanUrl = config.url ? config.url.replace(ENV.API_BASE_URL, '') : '';
      const isObservabilityEndpoint =
        cleanUrl.includes('/events') ||
        cleanUrl.includes('/tracking') ||
        cleanUrl.includes('/presence') ||
        cleanUrl.includes('/privacy') ||
        cleanUrl.includes('/health');

      const isCanceled =
        axios.isCancel(error) ||
        error?.code === 'ERR_CANCELED' ||
        error?.name === 'CanceledError' ||
        error?.message === 'canceled';

      if (
        !isObservabilityEndpoint &&
        !isCanceled &&
        typeof window !== 'undefined' &&
        window.trackingService
      ) {
        const status = error.response
          ? error.response.status
          : (error.code === 'ECONNABORTED' ? 408 : 0);

        if (status !== 0 || durationMs >= 100) {
          window.trackingService.track('api_error', {
            meta: {
              endpoint: cleanUrl,
              durationMs,
              status,
              errorCategory:
                status >= 500
                  ? 'SERVER_ERROR'
                  : status === 408
                  ? 'TIMEOUT'
                  : status === 0
                  ? 'NETWORK_ERROR'
                  : 'CLIENT_ERROR',
              actionId: config.headers?.['x-action-id'] || null,
            },
          });
        }
      }
    } catch { /* Request metadata is optional. */ }

    const originalRequest = error.config;
    const response = error.response;

    // Automatically refresh token if a 401 Unauthorized error is detected (single retry guard)
    if (response && response.status === 401 && originalRequest && !originalRequest._retry) {
      const isAuthPage = typeof window !== 'undefined' && (
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/register')
      );
      if (isAuthPage) {
        return Promise.reject(error);
      }

      // Do not attempt refresh on auth endpoints to prevent recursion loops
      if (originalRequest.url && (
        originalRequest.url.includes('/auth/refreshToken') ||
        originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/auth/signIn') ||
        originalRequest.url.includes('/auth/signOut')
      )) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const freshToken = await requestNewAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        return axiosClient(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    if (response && response.status === 403) {
      const isAuthPage = typeof window !== 'undefined' && (
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/register')
      );
      if (!isAuthPage) {
        const msg = response.data?.message || "";
        const isBlocked = msg.includes("khóa") || msg.includes("chặn") || msg.toLowerCase().includes("blocked");
        const isPermissionChange = msg.toLowerCase().includes("quyen") || msg.toLowerCase().includes("quyền") || msg.toLowerCase().includes("access");

        if (isBlocked || isPermissionChange) {
          try {
            useAuthStore.getState().logout();
          } catch {
            localStorage.removeItem("accessToken");
          }

          const noticeMsg = isBlocked 
            ? (msg || "Tài khoản của bạn đã bị khóa hoặc không tồn tại!") 
            : "Quyền truy cập của bạn đã thay đổi. Vui lòng đăng nhập lại.";

          sessionStorage.setItem("blockedMessage", noticeMsg);
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
    }

    if (response && response.status === 503 && response.data?.code === "MAINTENANCE") {
      try {
        window.dispatchEvent(
          new CustomEvent("maintenance:active", { detail: response.data })
        );
      } catch {
        // The storage fallback is deliberately best-effort.
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
