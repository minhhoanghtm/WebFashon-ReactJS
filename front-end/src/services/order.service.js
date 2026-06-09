import {
  createOrderApi,
  DashboardApi,
  dashboardUserApi,
  deleteOrderApi,
  getOrdersByUserApi,
  getRevenueOverviewApi,
  paymentOrderApi,
  updateOrderApi,
  getPurchasePerformanceApi,
} from "@/api/orderApi";

export const getOrdersByUserIdService = async () => {
  const response = await getOrdersByUserApi();
  return response.data;
};

export const createOrderService = async (data) => {
  const response = await createOrderApi(data);
  return response.data;
};

export const updateOrderService = async (id, data) => {
  const response = await updateOrderApi(id, data);
  return response.data;
};

export const deleteOrderService = async (id) => {
  const response = await deleteOrderApi(id);
  return response.data;
};

export const paymentOrderService = async (data) => {
  const response = await paymentOrderApi(data);
  return response.data;
};

export const DashboardService = async () => {
  const response = await DashboardApi();
  return response.data;
};

export const getRevenueOverviewService = async (type) => {
  const response = await getRevenueOverviewApi(type);
  return response.data;
}

export const dashboardUserService = async () => {
  const response = await dashboardUserApi();
  return response.data;
};

export const getPurchasePerformanceService = async () => {
  const response = await getPurchasePerformanceApi();
  return response.data;
};