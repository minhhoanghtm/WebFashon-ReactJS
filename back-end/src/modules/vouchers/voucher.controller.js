import voucherService from "./voucher.service.js";
import { successResponse, errorResponse } from "../../common/responses/index.js";

// USER CONTROLLERS

export const getPublicVouchers = async (req, res, next) => {
  try {
    const vouchers = await voucherService.getPublicVouchers();
    return res.status(200).json({
      success: true,
      data: vouchers,
    });
  } catch (error) {
    next(error);
  }
};

export const claimVoucher = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { voucherId } = req.body;

    if (!voucherId) {
      return res.status(400).json({
        success: false,
        message: "Mã định danh voucher (voucherId) là bắt buộc",
      });
    }

    const claimed = await voucherService.claimVoucher(userId, voucherId);
    return res.status(200).json({
      success: true,
      message: "Nhận mã giảm giá thành công",
      data: claimed,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserWallet = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query; // Optional filter: CLAIMED, USED, EXPIRED
    const wallet = await voucherService.getUserWallet(userId, status);
    return res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

export const validateVoucher = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá là bắt buộc",
      });
    }

    if (subtotal === undefined || subtotal < 0) {
      return res.status(400).json({
        success: false,
        message: "Tổng tiền đơn hàng không hợp lệ",
      });
    }

    const validationResult = await voucherService.validateVoucher(userId, code, subtotal);
    return res.status(200).json({
      success: true,
      message: "Áp dụng mã giảm giá thành công",
      data: validationResult,
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN CONTROLLERS

export const getAdminVouchers = async (req, res, next) => {
  try {
    const result = await voucherService.getAdminVouchers(req.query);
    return res.status(200).json({
      success: true,
      data: result.vouchers,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const createVoucher = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const voucher = await voucherService.createVoucher(adminId, req.body);
    return res.status(201).json({
      success: true,
      message: "Tạo voucher mới thành công",
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

export const updateVoucher = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const voucher = await voucherService.updateVoucher(adminId, id, req.body);
    return res.status(200).json({
      success: true,
      message: "Cập nhật voucher thành công",
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVoucher = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    await voucherService.deleteVoucher(adminId, id);
    return res.status(200).json({
      success: true,
      message: "Xóa voucher thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const toggleVoucherStatus = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const voucher = await voucherService.toggleVoucherStatus(adminId, id);
    return res.status(200).json({
      success: true,
      message: "Đổi trạng thái hoạt động của voucher thành công",
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await voucherService.getAdminDashboardStats();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

