import api from "./api";

export const validateVoucherApi = (code, subtotal, items, shippingFee) => {
  return api.post("/vouchers/validate", { code, subtotal, items, shippingFee });
};

export const getVouchersApi = () => {
  return api.get("/vouchers");
};
