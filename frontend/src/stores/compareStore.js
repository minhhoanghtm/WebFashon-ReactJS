import { create } from "zustand";

export const useCompareStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem("webfashion_compare_items") || "[]"),
  isDrawerOpen: false,

  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

  toggleCompare: (product) => {
    const current = get().items;
    const exists = current.some((p) => (p._id || p.id) === (product._id || product.id));

    let updated;
    if (exists) {
      updated = current.filter((p) => (p._id || p.id) !== (product._id || product.id));
    } else {
      if (current.length >= 4) {
        // Limit max 4 items
        updated = [...current.slice(1), product];
      } else {
        updated = [...current, product];
      }
    }

    localStorage.setItem("webfashion_compare_items", JSON.stringify(updated));
    set({ items: updated, isDrawerOpen: updated.length > 0 });
  },

  removeCompare: (productId) => {
    const updated = get().items.filter((p) => (p._id || p.id) !== productId);
    localStorage.setItem("webfashion_compare_items", JSON.stringify(updated));
    set({ items: updated, isDrawerOpen: updated.length > 0 });
  },

  clearCompare: () => {
    localStorage.removeItem("webfashion_compare_items");
    set({ items: [], isDrawerOpen: false });
  },

  isInCompare: (productId) => {
    return get().items.some((p) => (p._id || p.id) === productId);
  },
}));
