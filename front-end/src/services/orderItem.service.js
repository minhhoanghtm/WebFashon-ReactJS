import { createOrderItemApi, deleteOrderItemApi, getOrderItemsByOrderIdApi, updateOrderItemApi } from "@/api/orderItemApi";

export const getOrderItemsByOrderIdService = async (orderId) => {
    const response = await getOrderItemsByOrderIdApi(orderId);
    return response.data;
}

export const createOrderItemService = async (data) => {
    const response = await createOrderItemApi(data);
    return response.data;
}

export const updateOrderItemService = async (id, data) => {
    const response = await updateOrderItemApi(id, data);
    return response.data;
}

export const deleteOrderItemService = async (id) => {
    const response = await deleteOrderItemApi(id);
    return response.data;
}