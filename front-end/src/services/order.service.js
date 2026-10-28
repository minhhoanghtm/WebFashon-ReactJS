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
  getAdminOrdersApi,
  updateOrderStatusApi,
} from "@/api/orderApi";

export const getOrdersByUserIdService = async () => {
  const response = await getOrdersByUserApi();
  return response?.data ?? response;
};

export const createOrderService = async (data) => {
  const response = await createOrderApi(data);
  return response?.data ?? response;
};

export const updateOrderService = async (id, data) => {
  const response = await updateOrderApi(id, data);
  return response?.data ?? response;
};

export const deleteOrderService = async (id) => {
  const response = await deleteOrderApi(id);
  return response?.data ?? response;
};

export const paymentOrderService = async (data) => {
  const response = await paymentOrderApi(data);
  return response?.data ?? response;
};

export const DashboardService = async () => {
  const response = await DashboardApi();
  return response?.data?.data ?? response?.data ?? response;
};

export const getRevenueOverviewService = async (type) => {
  const response = await getRevenueOverviewApi(type);
  return response?.data?.data ?? response?.data ?? response;
};

export const dashboardUserService = async () => {
  const response = await dashboardUserApi();
  return response?.data ?? response;
};

export const getPurchasePerformanceService = async () => {
  const response = await getPurchasePerformanceApi();
  return response?.data ?? response;
};

export const getAdminOrdersService = async (params) => {
  const response = await getAdminOrdersApi(params);
  return response?.data?.data ?? response?.data ?? response;
};

export const updateOrderStatusService = async (id, status) => {
  const response = await updateOrderStatusApi(id, status);
  return response?.data ?? response;
};
