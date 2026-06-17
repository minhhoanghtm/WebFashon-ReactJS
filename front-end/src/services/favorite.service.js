import favoriteApi from "../api/favorite.api";

export const getFavoritesService = async () => {
  const res = await favoriteApi.getFavorites();
  return res.data ?? [];
};

export const toggleFavoriteService = async (productId) => {
  const res = await favoriteApi.toggleFavorite(productId);
  return res.data ?? { isFavorite: false, items: [] };
};

export const removeFavoriteService = async (productId) => {
  const res = await favoriteApi.removeFavorite(productId);
  return res.data ?? [];
};

export const clearFavoritesService = async () => {
  const res = await favoriteApi.clearFavorites();
  return res.data ?? [];
};
