import api from "./api";


export const getCartItemsApi = (cartId) => {
    return api.get(`/cart_items/${cartId}`);
}

export const addCartItemApi = (data) => {
    return api.post("/cart_items", data);
}

export const updateCartItemApi = (id, data) => {
    return api.put(`/cart_items/${id}`, data);
}

export const deleteCartItemApi = (id) => {
    return api.delete(`/cart_items/${id}`);
}