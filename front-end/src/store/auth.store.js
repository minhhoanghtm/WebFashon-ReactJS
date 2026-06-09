import { create } from 'zustand';
import { tokenStorage } from '../utils/token';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: tokenStorage.isAuthenticated(),
  isLoading: false,

  login: (token, user = null) => {
    tokenStorage.setToken(token);
    set({ isAuthenticated: true, user });
  },

  logout: () => {
    tokenStorage.removeToken();
    set({ isAuthenticated: false, user: null });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true });
  },

  setIsLoading: (isLoading) => {
    set({ isLoading });
  },
}));
