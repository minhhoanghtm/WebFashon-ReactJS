import Voucher from "./voucher.model.js";
import { successResponse, errorResponse } from "../../common/responses/index.js";

// Auto-seed mock vouchers if empty
const seedVouchers = async () => {
  const count = await Voucher.countDocuments();
  if (count === 0) {
    await Voucher.insertMany([
      {
        code: "WELCOME10",
        discount_type: "percentage",
        discount_value: 10,
        min_order_value: 100000,
        is_active: true,
      },
      {
        code: "LUSTRA50K",
        discount_type: "fixed",
        discount_value: 50000,
        min_order_value: 500000,
        is_active: true,
      },
      {
        code: "FREESHIP",
        discount_type: "fixed",
        discount_value: 30000, // standard shipping fee
        min_order_value: 300000,
        is_active: true,
      },
    ]);
    console.log("Seeded default vouchers successfully.");
  }
};

export const validateVoucher = async (req, res, next) => {
  try {
    await seedVouchers();

    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá là bắt buộc",
      });
    }

    const uppercaseCode = code.trim().toUpperCase();
    const voucher = await Voucher.findOne({ code: uppercaseCode, is_active: true });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Mã giảm giá không tồn tại hoặc đã hết hạn",
      });
    }

    const currentSubtotal = Number(subtotal) || 0;

    if (currentSubtotal < voucher.min_order_value) {
      return res.status(400).json({
        success: false,
        message: `Mã giảm giá này áp dụng cho đơn hàng tối thiểu ${voucher.min_order_value.toLocaleString("vi-VN")}đ`,
      });
    }

    let discount = 0;
    if (voucher.discount_type === "percentage") {
      discount = Math.round((voucher.discount_value / 100) * currentSubtotal);
    } else if (voucher.discount_type === "fixed") {
      discount = voucher.discount_value;
    }

    // Ensure discount doesn't exceed subtotal
    discount = Math.min(discount, currentSubtotal);

    return res.status(200).json({
      success: true,
      message: "Áp dụng mã giảm giá thành công",
      data: {
        code: voucher.code,
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value,
        discount_amount: discount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getVouchers = async (req, res, next) => {
  try {
    await seedVouchers();
    const vouchers = await Voucher.find({ is_active: true });
    return successResponse(res, vouchers);
  } catch (error) {
    next(error);
  }
};
