import voucherService from "../../../vouchers/voucher.service.js";

export class SearchVoucherTool {
  name = "search_voucher";

  async execute() {
    return voucherService.getPublicVouchers?.() || [];
  }
}
