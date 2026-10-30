import { create } from 'zustand';
import { tokenStorage } from '../utils/token';
import { rotateAnonymousId } from '../utils/anonymousId';
import sessionService from '../services/session.service';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: tokenStorage.isAuthenticated(),
  isLoading: tokenStorage.isAuthenticated(),

  login: (token, user = null) => {
    tokenStorage.setToken(token);
    set({ isAuthenticated: true, user });
  },

  logout: () => {
    tokenStorage.removeToken();
    try {
      rotateAnonymousId();
      sessionService.resetSession();
    } catch {
      // Bỏ qua lỗi rotate
    }
    set({ isAuthenticated: false, user: null });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true });
  },

  setIsLoading: (isLoading) => {
    set({ isLoading });
  },
}));
