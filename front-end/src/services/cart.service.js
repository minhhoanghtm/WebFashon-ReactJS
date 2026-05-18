import { addCartApi, deleteCartApi, getCartApi, updateCartApi } from "@/api/cartApi";



export const getCartService = async () => {
    const response = await getCartApi();
    return response.data;
};

export const addToCartService = async (data) => {
    const response = await addCartApi(data);
    return response.data;
};

export const updateCartService = async (id, data) => {
    const response = await updateCartApi(id, data);
    return response.data;
};

export const deleteCartService = async (id) => {
    const response = await deleteCartApi(id);
    return response.data;
};