import axiosClient from "./axiosClient";

export const validateVoucherApi = (code, subtotal, items, shippingFee) => {
  return axiosClient.post("/vouchers/validate", { code, subtotal, items, shippingFee });
};

export const getVouchersApi = () => {
  return axiosClient.get("/vouchers");
};
