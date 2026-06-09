import api from "./api";

export const getOrdersByUserApi = () => {
  return api.get("/order");
};

export const createOrderApi = (data) => {
  return api.post("/order", data);
};

export const updateOrderApi = (id, data) => {
  return api.put(`/order/${id}`, data);
};

export const deleteOrderApi = (id) => {
  return api.delete(`/order/${id}`);
};

export const paymentOrderApi = (data) => {
  return api.post("/order/payment", data);
};

export const DashboardApi = () => {
  return api.get("/order/admin/kpi");
};

export const getRevenueOverviewApi = (type) => {
  return api.get("/order/admin/revenue", {
    params: { type }
  });
};

export const getOrderStatsApi = (userId) => {
  return api.get("/order/admin/stats", {
    params: userId ? { userId } : {}
  });
};

export const dashboardUserApi = () => {
  return api.get("/order/user/revenue");
};

export const getPurchasePerformanceApi = () => {
  return api.get("/order/user/purchasing_performance");
};