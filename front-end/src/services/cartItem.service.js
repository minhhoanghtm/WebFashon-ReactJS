import { addCartItemApi, deleteCartItemApi, getCartItemsApi, updateCartItemApi } from "@/api/cartItemApi";

export const getCartItemsService = async (cartId) => {
  const res = await getCartItemsApi(cartId);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

export const addCartItemService = async (data) => {
  const res = await addCartItemApi(data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

export const updateCartItemService = async (id, data) => {
  const res = await updateCartItemApi(id, data);
  return res?.success !== undefined ? res : (res?.data ?? res);
};

export const deleteCartItemService = async (id) => {
  const res = await deleteCartItemApi(id);
  return res?.success !== undefined ? res : (res?.data ?? res);
};
