import axiosClient from "./axiosClient";

export const getCartItemsApi = (cartId) => {
  return axiosClient.get(`/cart_items/${cartId}`);
};

export const addCartItemApi = (data) => {
  return axiosClient.post("/cart_items", data);
};

export const updateCartItemApi = (id, data) => {
  return axiosClient.put(`/cart_items/${id}`, data);
};

export const deleteCartItemApi = (id) => {
  return axiosClient.delete(`/cart_items/${id}`);
};
