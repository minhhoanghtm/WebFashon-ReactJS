import axiosClient from "./axiosClient";

export const voucherApi = {
  // Client APIs
  getPublicVouchers: () => axiosClient.get("/vouchers"),
  claimVoucher: (voucherId) => axiosClient.post("/vouchers/claim", { voucherId }),
  getUserWallet: (status) => axiosClient.get("/vouchers/wallet", { params: status ? { status } : {} }),
  validateVoucher: (code, subtotal, items, shippingFee) => axiosClient.post("/vouchers/validate", { code, subtotal, items, shippingFee }),

  // Admin APIs
  getAdminVouchers: (params) => axiosClient.get("/vouchers/admin", { params }),
  getAdminVouchersStats: () => axiosClient.get("/vouchers/admin/stats"),
  createVoucher: (data) => axiosClient.post("/vouchers/admin", data),
  updateVoucher: (id, data) => axiosClient.put(`/vouchers/admin/${id}`, data),
  deleteVoucher: (id) => axiosClient.delete(`/vouchers/admin/${id}`),
  toggleVoucherStatus: (id) => axiosClient.patch(`/vouchers/admin/${id}/status`),
};

export default voucherApi;
