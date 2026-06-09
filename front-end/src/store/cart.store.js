import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  isLoading: false,

  setCartItems: (items) => {
    set({ items });
  },

  addItem: (item) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i._id === item._id);

    if (existingIndex > -1) {
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += item.quantity || 1;
      set({ items: updatedItems });
    } else {
      set({ items: [...items, { ...item, quantity: item.quantity || 1 }] });
    }
  },

  updateItemQuantity: (itemId, quantity) => {
    const { items } = get();
    const updatedItems = items.map((item) =>
      item._id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
    );
    set({ items: updatedItems });
  },

  removeItem: (itemId) => {
    const { items } = get();
    set({ items: items.filter((item) => item._id !== itemId) });
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotalQuantity: () => {
    return get().items.reduce((total, item) => total + (item.quantity || 0), 0);
  },

  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0);
  },
}));
