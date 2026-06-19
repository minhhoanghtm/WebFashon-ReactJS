import axiosClient from "./axiosClient";

const favoriteApi = {
  getFavorites: () => axiosClient.get("/favorites"),
  addFavorite: (productId) => axiosClient.post("/favorites", { product_id: productId }),
  toggleFavorite: (productId) => axiosClient.post("/favorites/toggle", { product_id: productId }),
  removeFavorite: (productId) => axiosClient.delete(`/favorites/${productId}`),
  clearFavorites: () => axiosClient.delete("/favorites"),
};

export default favoriteApi;
