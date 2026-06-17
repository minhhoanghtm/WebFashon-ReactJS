import { validateVoucherApi, getVouchersApi } from "@/api/voucherApi";

export const validateVoucherService = async (code, subtotal, items, shippingFee) => {
  const res = await validateVoucherApi(code, subtotal, items, shippingFee);
  return res.data;
};

export const getVouchersService = async () => {
  const res = await getVouchersApi();
  return res.data;
};
