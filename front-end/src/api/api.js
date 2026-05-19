import axios from "axios";

const isLocalhost =
  typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

const apiBaseURL =
  isLocalhost
    ? "http://localhost:5000/api"
    : import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

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

export default api;