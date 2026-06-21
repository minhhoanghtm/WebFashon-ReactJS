/**
 * Order validators — Zod schema-based.
 * Giữ nguyên tên export để không break order.route.js.
 */
import { z } from "zod";
import { validate } from "../../common/utils/validate.js";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const validStatuses = ["pending", "confirmed", "shipping", "shipped", "delivered", "cancelled"];

const updateOrderStatusSchema = z.object({
  status: z.enum(validStatuses, {
    required_error: "Trạng thái mới không được để trống",
    message: `Trạng thái không hợp lệ. Các trạng thái hợp lệ: ${validStatuses.join(", ")}`,
  }),
});

// ---------------------------------------------------------------------------
// Middleware export — tên giữ nguyên, backward compatible với order.route.js
// ---------------------------------------------------------------------------

export const validateUpdateOrderStatus = validate(updateOrderStatusSchema);