import axiosClient from "./axiosClient";

export const getOrderItemsByOrderIdApi = (orderId) => {
  return axiosClient.get(`/order_items/${orderId}`);
};

export const createOrderItemApi = (orderItem) => {
  return axiosClient.post("/order_items", orderItem);
};

export const updateOrderItemApi = (id, orderItem) => {
  return axiosClient.put(`/order_items/${id}`, orderItem);
};

export const deleteOrderItemApi = (id) => {
  return axiosClient.delete(`/order_items/${id}`);
};
