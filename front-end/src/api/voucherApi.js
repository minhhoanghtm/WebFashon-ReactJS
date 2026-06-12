import api from "./api";

export const validateVoucherApi = (code, subtotal) => {
  return api.post("/vouchers/validate", { code, subtotal });
};

export const getVouchersApi = () => {
  return api.get("/vouchers");
};
