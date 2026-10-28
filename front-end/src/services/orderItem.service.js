import { createOrderItemApi, deleteOrderItemApi, getOrderItemsByOrderIdApi, updateOrderItemApi } from "@/api/orderItemApi";

export const getOrderItemsByOrderIdService = async (orderId) => {
  const response = await getOrderItemsByOrderIdApi(orderId);
  return response?.data ?? response;
};

export const createOrderItemService = async (data) => {
  const response = await createOrderItemApi(data);
  return response?.data ?? response;
};

export const updateOrderItemService = async (id, data) => {
  const response = await updateOrderItemApi(id, data);
  return response?.data ?? response;
};

export const deleteOrderItemService = async (id) => {
  const response = await deleteOrderItemApi(id);
  return response?.data ?? response;
};
