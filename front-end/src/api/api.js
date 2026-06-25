import axios from "axios";

const isLocalhost =
  typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

const apiBaseURL =
  import.meta.env.VITE_API_URL ||
  (isLocalhost
    ? "http://localhost:5000/api"
    : import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

const api = axios.create({
  baseURL: apiBaseURL,
});

if (isLocalhost && apiBaseURL.includes("localhost:5000")) {
  console.warn("Localhost detected. Using local backend API:", apiBaseURL);
} else if (!import.meta.env.VITE_API_URL) {
  console.warn("VITE_API_URL is not set. Using fallback baseURL:", apiBaseURL);
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    // console.log("Token trong interceptor:", token);

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        // console.log("userId từ token:", payload.userId);
      } catch (err) {
        console.log("Token decode lỗi");
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle silent token refresh
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

api.interceptors.response.use(
  (response) => {
    return response;
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
            return api(originalRequest);
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
          `${apiBaseURL}/auth/refreshToken`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken || refreshResponse.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem("accessToken", newAccessToken);

          // Sync the new token with zustand auth store
          try {
            const { useAuthStore } = await import("../store/auth.store");
            const currentUser = useAuthStore.getState().user;
            useAuthStore.getState().login(newAccessToken, currentUser);
          } catch (storeErr) {
            // Ignore if store is not available
          }

          processQueue(null, newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          throw new Error("No access token returned from refresh endpoint");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Only log out if refreshing failed (e.g. refresh token expired or invalid)
        try {
          const { useAuthStore } = await import("../store/auth.store");
          useAuthStore.getState().logout();
        } catch (storeErr) {
          localStorage.removeItem("accessToken");
        }
        window.location.href = '/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

