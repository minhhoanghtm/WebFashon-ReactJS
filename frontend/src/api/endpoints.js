import apiClient from "./client";

export const authApi = {
  login: (data) => apiClient.post("/auth/login", data),
  register: (data) => apiClient.post("/auth/register", data),
  sendOtp: (data) => apiClient.post("/auth/register/send-otp", data),
  verifyOtp: (data) => apiClient.post("/auth/verify-otp", data),
  forgotPassword: (data) => apiClient.post("/auth/password/forgot", data),
  resetPassword: (data) => apiClient.post("/auth/password/reset", data),
  getMe: () => apiClient.get("/user/me"),
  updateProfile: (data) => apiClient.put("/user/profile", data),
  addAddress: (data) => apiClient.post("/user/addresses", data),
  logout: () => apiClient.post("/auth/logout"),
};

export const productApi = {
  getAll: (params) => apiClient.get("/products", { params }),
  getBySlug: (slug) => apiClient.get(`/products/${slug}`),
  getById: (id) => apiClient.get(`/products/detail/${id}`),
  search: (params) => apiClient.get("/products/search", { params }),
  getAvailability: (id) => apiClient.get(`/products/${id}/availability`),
  getVariants: (productId) => apiClient.get(`/product_variants/${productId}`),
};

export const categoryApi = {
  getAll: () => apiClient.get("/categories"),
  getById: (id) => apiClient.get(`/categories/${id}`),
};

export const cartApi = {
  getCart: () => apiClient.get("/cart"),
  addItem: (data) => apiClient.post("/cart_items", data),
  updateItem: (id, data) => apiClient.put(`/cart_items/${id}`, data),
  removeItem: (id) => apiClient.delete(`/cart_items/${id}`),
};

export const orderApi = {
  create: (data) => apiClient.post("/order", data),
  getMyOrders: (params) => apiClient.get("/order/my-orders", { params }),
  getById: (id) => apiClient.get(`/order/${id}`),
  lookup: (params) => apiClient.get("/order/lookup", { params }),
};

export const voucherApi = {
  getAll: () => apiClient.get("/vouchers"),
  getMyVouchers: () => apiClient.get("/vouchers/my"),
  saveVoucher: (data) => apiClient.post("/vouchers/save", data),
  applyVoucher: (data) => apiClient.post("/vouchers/apply", data),
};

export const contentApi = {
  getBanners: () => apiClient.get("/banners"),
  getLookbooks: () => apiClient.get("/lookbooks"),
  getCampaigns: () => apiClient.get("/campaigns"),
  getPage: (slug) => apiClient.get(`/pages/${slug}`),
  getSettings: () => apiClient.get("/settings"),
};

export const shippingApi = {
  calculateFee: (data) => apiClient.post("/shipping/fee", data),
};

export const aiApi = {
  chat: (data) => apiClient.post("/ai/chat", data),
  confirmAction: (id) => apiClient.post(`/ai/actions/${id}/confirm`),
};

export const adminApi = {
  getDashboardStats: () => apiClient.get("/admin/dashboard/stats"),
  getRevenue: (params) => apiClient.get("/admin/dashboard/revenue", { params }),
  getOrders: (params) => apiClient.get("/order/admin/all", { params }),
  updateOrderStatus: (id, status) => apiClient.put(`/order/${id}/status`, { status }),
  getCustomers: (params) => apiClient.get("/user/admin/all", { params }),
  updateUserStatus: (id, status) => apiClient.put(`/user/${id}/status`, { status }),
  createCategory: (data) => apiClient.post("/categories", data),
  updateCategory: (id, data) => apiClient.put(`/categories/${id}`, data),
  deleteCategory: (id) => apiClient.delete(`/categories/${id}`),
  createProduct: (data) => apiClient.post("/products", data),
  updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
  createVoucher: (data) => apiClient.post("/vouchers", data),
  updateVoucher: (id, data) => apiClient.put(`/vouchers/${id}`, data),
  deleteVoucher: (id) => apiClient.delete(`/vouchers/${id}`),
  getConversations: () => apiClient.get("/admin/conversations"),
  getMessages: (id) => apiClient.get(`/admin/messages/${id}`),
  updateSettings: (data) => apiClient.put("/settings", data),
};
