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
axiosClient.interceptors.response.use(
  (response) => {
    // Return standard success response data (typically { success: true, data: ..., message: ... })
    return response.data;
  },
  (error) => {
    const response = error.response;
    
    // Automatically log out if a 401 Unauthorized error is detected (except on auth pages)
    if (response && response.status === 401) {
      const isAuthPage = window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/register');
      if (!isAuthPage) {
        // useAuthStore.getState().logout();
        // window.location.href = '/login';
        console.warn("API 401 Unauthorized detected. Redirection disabled for development.");
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
