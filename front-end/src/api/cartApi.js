import api from "./api";

export const getCartApi = () => {
    return api.get("/cart");
}

export const addCartApi = (data) => {
    return api.post("/cart", data);
}

export const updateCartApi = (id, data) => {
    return api.put(`/cart/${id}`, data);
}

export const deleteCartApi = (id) => {
    return api.delete(`/cart/${id}`);
}
