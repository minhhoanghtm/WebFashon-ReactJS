import { create } from "zustand";
import {
  clearFavoritesService,
  getFavoritesService,
  removeFavoriteService,
  toggleFavoriteService,
} from "../services/favorite.service";

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const getCategoryName = (product = {}) => {
  const category = firstValue(product.category, product.categoryName, product.category_id);

  if (typeof category === "object") {
    return firstValue(category.name, category.title, "Thời trang");
  }

  return firstValue(category, "Thời trang");
};

const normalizeFavoriteProduct = (favoriteOrProduct = {}) => {
  const product = favoriteOrProduct.product_id || favoriteOrProduct;
  const id = String(firstValue(product.id, product._id, product.productId, ""));
  const image = firstValue(
    product.image,
    Array.isArray(product.images) ? product.images.find(Boolean) : product.images,
    Array.isArray(product.displayProduct)
      ? product.displayProduct.find(Boolean)
      : product.displayProduct,
    product.imageUrl,
    product.image_url,
    product.thumbnail,
    "",
  );

  return {
    id,
    _id: firstValue(product._id, product.id, id),
    slug: firstValue(product.slug, product.productSlug, ""),
    name: firstValue(product.name, product.productName, product.title, "Sản phẩm"),
    price: Number(firstValue(product.price, product.new_price, 0)) || 0,
    oldPrice: Number(firstValue(product.oldPrice, product.old_price, 0)) || 0,
    image,
    displayProduct: image ? [image] : [],
    category: getCategoryName(product),
    rating: Number(firstValue(product.rating, product.rate, 0)) || 0,
    badge: firstValue(product.badge, product.tag, ""),
    description: firstValue(product.description, ""),
  };
};

const normalizeFavorites = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map(normalizeFavoriteProduct)
    .filter((item) => item.id);

export const useFavoriteStore = create((set, get) => ({
  items: [],
  isLoading: false,

  loadFavorites: async () => {
    try {
      set({ isLoading: true });
      const items = await getFavoritesService();
      set({ items: normalizeFavorites(items) });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleProduct: async (product) => {
    const favoriteProduct = normalizeFavoriteProduct(product);
    if (!favoriteProduct.id) return;

    const previousItems = get().items;
    const exists = previousItems.some((item) => String(item.id) === favoriteProduct.id);
    const optimisticItems = exists
      ? previousItems.filter((item) => String(item.id) !== favoriteProduct.id)
      : [favoriteProduct, ...previousItems];

    set({ items: optimisticItems });

    try {
      const result = await toggleFavoriteService(favoriteProduct.id);
      set({ items: normalizeFavorites(result.items || []) });
    } catch (error) {
      set({ items: previousItems });
      throw error;
    }
  },

  removeProduct: async (productId) => {
    const id = String(productId);
    const previousItems = get().items;
    set({ items: previousItems.filter((item) => String(item.id) !== id) });

    try {
      const items = await removeFavoriteService(id);
      set({ items: normalizeFavorites(items) });
    } catch (error) {
      set({ items: previousItems });
      throw error;
    }
  },

  clearFavorites: async () => {
    const previousItems = get().items;
    set({ items: [] });

    try {
      await clearFavoritesService();
    } catch (error) {
      set({ items: previousItems });
      throw error;
    }
  },

  resetFavorites: () => {
    set({ items: [], isLoading: false });
  },

  isFavorite: (productId) => {
    const id = String(productId);
    return get().items.some((item) => String(item.id) === id);
  },
}));
