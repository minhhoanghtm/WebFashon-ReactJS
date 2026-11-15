import { create } from "zustand";
import { cartApi } from "../api/endpoints";

export const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem("webfashion_local_cart") || "[]"),
  isLoading: false,
  error: null,

  fetchCart: async () => {
    const token = localStorage.getItem("webfashion_token");
    if (!token) {
      // Guest local cart
      return get().items;
    }
    set({ isLoading: true });
    try {
      const res = await cartApi.getCart();
      const serverItems = res.data?.items || res.data?.cart_items || [];
      set({ items: serverItems, isLoading: false });
      return serverItems;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return get().items;
    }
  },

  addItem: async (item) => {
    const token = localStorage.getItem("webfashion_token");
    if (token) {
      try {
        await cartApi.addItem({
          product_id: item.productId || item.id,
          variant_id: item.variantId,
          quantity: item.quantity || 1,
        });
        await get().fetchCart();
        return;
      } catch (err) {
        // Fallback to local cart update
      }
    }

    // Local cart logic
    const current = [...get().items];
    const existingIndex = current.findIndex(
      (i) => (i.variantId && i.variantId === item.variantId) || i.id === item.id
    );

    if (existingIndex > -1) {
      current[existingIndex].quantity += item.quantity || 1;
    } else {
      current.push({
        ...item,
        quantity: item.quantity || 1,
      });
    }

    localStorage.setItem("webfashion_local_cart", JSON.stringify(current));
    set({ items: current });
  },

  updateQuantity: async (itemId, quantity) => {
    if (quantity <= 0) {
      return get().removeItem(itemId);
    }
    const token = localStorage.getItem("webfashion_token");
    if (token) {
      try {
        await cartApi.updateItem(itemId, { quantity });
        await get().fetchCart();
        return;
      } catch (err) {}
    }

    const current = get().items.map((i) =>
      (i._id === itemId || i.id === itemId) ? { ...i, quantity } : i
    );
    localStorage.setItem("webfashion_local_cart", JSON.stringify(current));
    set({ items: current });
  },

  removeItem: async (itemId) => {
    const token = localStorage.getItem("webfashion_token");
    if (token) {
      try {
        await cartApi.removeItem(itemId);
        await get().fetchCart();
        return;
      } catch (err) {}
    }

    const current = get().items.filter(
      (i) => i._id !== itemId && i.id !== itemId
    );
    localStorage.setItem("webfashion_local_cart", JSON.stringify(current));
    set({ items: current });
  },

  clearCart: () => {
    localStorage.removeItem("webfashion_local_cart");
    set({ items: [] });
  },

  getTotal: () => {
    return get().items.reduce(
      (acc, item) => acc + (item.price || item.new_price || 0) * (item.quantity || 1),
      0
    );
  },

  getCount: () => {
    return get().items.reduce((acc, item) => acc + (item.quantity || 1), 0);
  },
}));
