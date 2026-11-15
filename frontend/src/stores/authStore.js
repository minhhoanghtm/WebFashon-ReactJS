import { create } from "zustand";
import { authApi } from "../api/endpoints";

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem("webfashion_user") || "null"),
  token: localStorage.getItem("webfashion_token") || null,
  isLoading: false,
  error: null,

  setAuth: (user, token) => {
    localStorage.setItem("webfashion_user", JSON.stringify(user));
    localStorage.setItem("webfashion_token", token);
    set({ user, token, error: null });
  },

  login: async (email, passWord) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login({ email, passWord });
      const user = res.data?.user || res.data;
      const token = res.data?.accessToken || res.data?.token;
      get().setAuth(user, token);
      set({ isLoading: false });
      return { success: true, user };
    } catch (err) {
      set({ isLoading: false, error: err.message || "Đăng nhập thất bại" });
      return { success: false, error: err.message };
    }
  },

  logout: async () => {
    try {
      await authApi.logout().catch(() => {});
    } finally {
      localStorage.removeItem("webfashion_user");
      localStorage.removeItem("webfashion_token");
      set({ user: null, token: null });
    }
  },

  fetchMe: async () => {
    const token = get().token;
    if (!token) return null;
    try {
      const res = await authApi.getMe();
      const user = res.data;
      if (user) {
        localStorage.setItem("webfashion_user", JSON.stringify(user));
        set({ user });
      }
      return user;
    } catch (err) {
      if (err.status === 401) {
        get().logout();
      }
      return null;
    }
  },
}));
