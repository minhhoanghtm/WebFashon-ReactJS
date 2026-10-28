import axiosClient from "./axiosClient";

export const getCartApi = () => {
  return axiosClient.get("/cart");
};

export const addCartApi = (data) => {
  return axiosClient.post("/cart", data);
};

export const updateCartApi = (id, data) => {
  return axiosClient.put(`/cart/${id}`, data);
};

export const deleteCartApi = (id) => {
  return axiosClient.delete(`/cart/${id}`);
};
