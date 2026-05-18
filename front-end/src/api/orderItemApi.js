import api from "./api";

export const getOrderItemsByOrderIdApi = (orderId) => {
    return api.get(`/order_items?orderId=${orderId}`);
};

export const createOrderItemApi = (orderItem) => {
    return api.post("/order_items", orderItem);
};

export const updateOrderItemApi = (id, orderItem) => {
    return api.put(`/order_items/${id}`, orderItem);
};

export const deleteOrderItemApi = (id) => {
    return api.delete(`/order_items/${id}`);
};