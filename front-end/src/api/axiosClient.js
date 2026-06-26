import axios from 'axios';
import { ENV } from '../config/env';
import { tokenStorage } from '../utils/token';
import { useAuthStore } from '../store/auth.store';

const axiosClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response/Request state for token refresh queueing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to dynamically inject the JWT bearer token with proactive renewal
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
        
        // If the token is about to expire in less than 5 minutes (300,000 ms), proactively refresh it
        if (expirationTime - currentTime < 5 * 60 * 1000) {
          if (isRefreshing) {
            try {
              const newAccessToken = await new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              });
              config.headers.Authorization = `Bearer ${newAccessToken}`;
              return config;
            } catch (err) {
              return config; // Fallback to current token, let the request fail and trigger standard 401 logout
            }
          }

          isRefreshing = true;
          try {
            const refreshResponse = await axios.post(
              `${ENV.API_BASE_URL}/auth/refreshToken`,
              {},
              { withCredentials: true }
            );

            const newAccessToken = refreshResponse.data?.data?.accessToken || refreshResponse.data?.accessToken;
            if (newAccessToken) {
              tokenStorage.setToken(newAccessToken);
              
              const currentUser = useAuthStore.getState().user;
              useAuthStore.getState().login(newAccessToken, currentUser);

              processQueue(null, newAccessToken);
              config.headers.Authorization = `Bearer ${newAccessToken}`;
            } else {
              throw new Error("No access token returned from refresh endpoint");
            }
          } catch (refreshError) {
            processQueue(refreshError, null);
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }
      }
      
      // Inject bearer token (if we didn't refresh or refresh updated it)
      const currentToken = tokenStorage.getToken();
      if (currentToken && config.headers) {
        config.headers.Authorization = `Bearer ${currentToken}`;
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
    // Return standard success response data (typically { success: true, data: ..., message: ... })
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const response = error.response;
    
    // Automatically refresh token if a 401 Unauthorized error is detected (except on auth pages)
    if (response && response.status === 401 && !originalRequest._retry) {
      const isAuthPage = window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/register');
      if (isAuthPage) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Request a new access token from the refresh token cookie
        const refreshResponse = await axios.post(
          `${ENV.API_BASE_URL}/auth/refreshToken`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken || refreshResponse.data?.accessToken;
        if (newAccessToken) {
          tokenStorage.setToken(newAccessToken);
          
          // Retrieve the current user from store to pass to login
          const currentUser = useAuthStore.getState().user;
          useAuthStore.getState().login(newAccessToken, currentUser);

          processQueue(null, newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        } else {
          throw new Error("No access token returned from refresh endpoint");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Only log out if refreshing failed (e.g. refresh token expired or invalid)
        useAuthStore.getState().logout();
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (response && response.status === 403) {
      const isAuthPage = window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/register');
      if (!isAuthPage) {
        const msg = response.data?.message || "";
        const isBlocked = msg.includes("khóa") || msg.includes("chặn") || msg.toLowerCase().includes("blocked");
        const isPermissionChange = msg.toLowerCase().includes("quyen") || msg.toLowerCase().includes("quyền") || msg.toLowerCase().includes("access");

        if (isBlocked || isPermissionChange) {
          try {
            useAuthStore.getState().logout();
          } catch (storeErr) {
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

    return Promise.reject(error);
  }
);

export default axiosClient;
