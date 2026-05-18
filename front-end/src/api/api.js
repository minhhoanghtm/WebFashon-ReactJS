import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

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