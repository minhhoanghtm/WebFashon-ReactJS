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

// Request interceptor to dynamically inject the JWT bearer token
axiosClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors, mapping response formats, and intercepting 401
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
    
    return Promise.reject(error);
  }
);

export default axiosClient;
