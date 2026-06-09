import axiosClient from './axiosClient';

export const cartApi = {
  // Cart
  getCart: () => axiosClient.get('/cart'),
  addCart: (data) => axiosClient.post('/cart', data),
  updateCart: (id, data) => axiosClient.put(`/cart/${id}`, data),
  deleteCart: (id) => axiosClient.delete(`/cart/${id}`),

  // CartItems
  getCartItems: (cartId) => axiosClient.get(`/cart_items/${cartId}`),
  addCartItem: (data) => axiosClient.post('/cart_items', data),
  updateCartItem: (id, data) => axiosClient.put(`/cart_items/${id}`, data),
  deleteCartItem: (id) => axiosClient.delete(`/cart_items/${id}`),
};
