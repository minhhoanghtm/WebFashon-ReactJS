import { validateVoucherApi, getVouchersApi } from "@/api/voucherApi";

export const validateVoucherService = async (code, subtotal) => {
  const res = await validateVoucherApi(code, subtotal);
  return res;
};

export const getVouchersService = async () => {
  const res = await getVouchersApi();
  return res;
};
