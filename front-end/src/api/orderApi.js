import axiosClient from "./axiosClient";

export const getOrdersByUserApi = () => {
  return axiosClient.get("/order");
};

export const createOrderApi = (data) => {
  return axiosClient.post("/order", data);
};

export const updateOrderApi = (id, data) => {
  return axiosClient.put(`/order/${id}`, data);
};

export const deleteOrderApi = (id) => {
  return axiosClient.delete(`/order/${id}`);
};

export const paymentOrderApi = (data) => {
  return axiosClient.post("/order/payment", data);
};

export const DashboardApi = () => {
  return axiosClient.get("/order/admin/kpi");
};

export const getRevenueOverviewApi = (type) => {
  return axiosClient.get("/order/admin/revenue", {
    params: { type },
  });
};

export const getOrderStatsApi = (userId) => {
  return axiosClient.get("/order/admin/stats", {
    params: userId ? { userId } : {},
  });
};

export const dashboardUserApi = () => {
  return axiosClient.get("/order/user/revenue");
};

export const getPurchasePerformanceApi = () => {
  return axiosClient.get("/order/user/purchasing_performance");
};

export const getAdminOrdersApi = (params) => {
  return axiosClient.get("/order/admin/orders", { params });
};

export const updateOrderStatusApi = (id, status) => {
  return axiosClient.patch(`/order/admin/orders/${id}/status`, { status });
};
