import axiosClient from './axiosClient';

export const orderApi = {
  // Orders
  getOrdersByUser: () => axiosClient.get('/order'),
  createOrder: (data) => axiosClient.post('/order', data),
  updateOrder: (id, data) => axiosClient.put(`/order/${id}`, data),
  deleteOrder: (id) => axiosClient.delete(`/order/${id}`),
  paymentOrder: (data) => axiosClient.post('/order/payment', data),
  Dashboard: () => axiosClient.get('/order/admin/kpi'),
  getRevenueOverview: (type) => axiosClient.get('/order/admin/revenue', { params: { type } }),
  getOrderStats: (userId) => axiosClient.get('/order/admin/stats', { params: userId ? { userId } : {} }),
  dashboardUser: () => axiosClient.get('/order/user/revenue'),
  getPurchasePerformance: () => axiosClient.get('/order/user/purchasing_performance'),

  // OrderItems
  getOrderItemsByOrderId: (orderId) => axiosClient.get(`/order_items?orderId=${orderId}`),
  createOrderItem: (orderItem) => axiosClient.post('/order_items', orderItem),
  updateOrderItem: (id, orderItem) => axiosClient.put(`/order_items/${id}`, orderItem),
  deleteOrderItem: (id) => axiosClient.delete(`/order_items/${id}`),
};
