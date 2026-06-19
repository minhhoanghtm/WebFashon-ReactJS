import { create } from "zustand";

export const useChatContextStore = create((set) => ({
  isOpen: false,
  context: null,
  openChat: (context = null) =>
    set((state) => ({ isOpen: true, context: context || state.context })),

  closeChat: () => set({ isOpen: false }),

  setContext: (context) => set({ context }),

  clearContext: () => set({ context: null }),
}));
