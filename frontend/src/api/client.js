import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to attach bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("webfashion_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to normalize errors and handle 401
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject({ isCanceled: true });
    }

    const originalRequest = error.config;

    // Handle token expiration / 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data?.data?.accessToken || res.data?.accessToken;
        if (newToken) {
          localStorage.setItem("webfashion_token", newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem("webfashion_token");
        localStorage.removeItem("webfashion_user");
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "Đã có lỗi xảy ra khi kết nối máy chủ";
    const status = error.response?.status || 500;
    const details = error.response?.data?.details || null;

    return Promise.reject({
      status,
      message,
      details,
      raw: error,
    });
  }
);

export default apiClient;
