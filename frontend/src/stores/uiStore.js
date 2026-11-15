import { create } from "zustand";

export const useUiStore = create((set) => ({
  isAiModalOpen: false,
  isSearchModalOpen: false,
  isMobileMenuOpen: false,
  searchQuery: "",

  openAiModal: () => set({ isAiModalOpen: true }),
  closeAiModal: () => set({ isAiModalOpen: false }),

  openSearchModal: () => set({ isSearchModalOpen: true }),
  closeSearchModal: () => set({ isSearchModalOpen: false }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));
