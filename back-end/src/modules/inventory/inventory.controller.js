import mongoose from "mongoose";
import inventoryReservationService from "./inventoryReservation.service.js";
import { successResponse, errorResponse } from "../../common/responses/index.js";
import { isFeatureEnabled } from "../../common/utils/featureFlags.js";

/**
 * Create a new 5-minute atomic checkout reservation.
 * POST /api/checkout/reservations or POST /api/inventory/reservations
 */
export const createCheckoutReservation = async (req, res, next) => {
  try {
    let userId = req.user?.userId || req.user?._id || req.body?.userId;

    if (!userId) {
      const guestAllowed = await isFeatureEnabled("allowGuestCheckout");
      if (!guestAllowed) {
        return errorResponse(res, "Vui lòng đăng nhập để tiến hành đặt hàng", 403, "GUEST_CHECKOUT_DISABLED");
      }
      // Generate deterministic or random guest ObjectId for ledger consistency
      userId = new mongoose.Types.ObjectId();
    }

    const { items, idempotencyKey, checkoutSessionId } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, "Danh sách sản phẩm thanh toán không được trống", 400);
    }

    const reservation = await inventoryReservationService.createReservation({
      userId,
      items,
      idempotencyKey,
      checkoutSessionId,
    });

    return successResponse(res, reservation, "Khởi tạo phiên giữ hàng thành công (5 phút)", 201);
  } catch (error) {
    if (error.statusCode === 409 || error.code === "INSUFFICIENT_STOCK") {
      return errorResponse(
        res,
        error.message || "Sản phẩm không đủ số lượng khả dụng trong kho",
        409,
        "INSUFFICIENT_STOCK",
        {
          sku: error.sku,
          available: error.available,
        }
      );
    }
    next(error);
  }
};

/**
 * Get reservation detail.
 * GET /api/checkout/reservations/:id or GET /api/inventory/reservations/:id
 */
export const getReservationDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reservation = await inventoryReservationService.getReservation(id);
    if (!reservation) {
      return errorResponse(res, "Không tìm thấy thông tin giữ hàng", 404);
    }

    // Authorization check: User can only access their own reservation
    const currentUserId = req.user?.userId || req.user?._id;
    if (currentUserId && reservation.userId && String(reservation.userId) !== String(currentUserId)) {
      return errorResponse(res, "Bạn không có quyền truy cập phiên giữ hàng này", 403);
    }

    return successResponse(res, reservation, "Lấy thông tin giữ hàng thành công", 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel or release reservation immediately.
 * POST /api/checkout/reservations/:id/cancel or POST /api/inventory/reservations/:id/release
 */
export const releaseReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = "USER_CANCELLED" } = req.body || {};

    const reservation = await inventoryReservationService.getReservation(id);
    if (reservation) {
      const currentUserId = req.user?.userId || req.user?._id;
      if (currentUserId && reservation.userId && String(reservation.userId) !== String(currentUserId)) {
        return errorResponse(res, "Bạn không có quyền hủy phiên giữ hàng này", 403);
      }
    }

    await inventoryReservationService.releaseReservation(id, reason);
    return successResponse(res, { reservationId: id, status: "CANCELLED" }, "Đã giải phóng sản phẩm đang giữ", 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Check product / variant stock availability factoring in active reservations.
 * GET /api/products/:id/availability or GET /api/inventory/availability
 */
export const checkAvailability = async (req, res, next) => {
  try {
    const productId = req.params.id || req.query.productId;
    const variantId = req.query.variantId || null;

    if (!productId && !variantId) {
      return errorResponse(res, "productId hoặc variantId là bắt buộc", 400);
    }

    const availableStock = await inventoryReservationService.getAvailableStock(productId, variantId);
    const sku = inventoryReservationService.getSku(productId, variantId);
    const reservedStock = await inventoryReservationService.getReservedStock(sku);

    return successResponse(
      res,
      {
        productId,
        variantId,
        availableStock,
        reservedStock,
        inStock: availableStock > 0,
      },
      "Kiểm tra tồn kho khả dụng thành công",
      200
    );
  } catch (error) {
    next(error);
  }
};
