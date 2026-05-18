import { addCartItemApi, deleteCartItemApi, getCartItemsApi, updateCartItemApi } from "@/api/cartItemApi";

export const getCartItemsService = async (cartId) => {
    const res = await getCartItemsApi(cartId);
    return res.data;
};

export const addCartItemService = async (data) => {
    const res = await addCartItemApi(data);
    return res.data;
};

export const updateCartItemService = async (id, data) => {
    const res = await updateCartItemApi(id, data);
    return res.data;
};

export const deleteCartItemService = async (id) => {
    const res = await deleteCartItemApi(id);
    return res.data;
}