/**
 * WebsiteSettings validators — Zod schema-based.
 * Giữ nguyên tên export để không break websiteSettings.route.js.
 *
 * Đặc biệt xử lý:
 *  - Nested object `general` với các field bắt buộc
 *  - Nested object `system` với boolean coercion (string "true"/"false" → boolean)
 */
import { z } from "zod";
import { validate } from "../../common/utils/validate.js";
import { zodEmail } from "../../common/utils/schemas.js";

// ---------------------------------------------------------------------------
// Boolean coercion — chấp nhận true/false/"true"/"false"
// ---------------------------------------------------------------------------

const zodBoolCoerce = z.preprocess(
  (val) => {
    if (typeof val === "string") return val === "true";
    return val;
  },
  z.boolean().optional()
);

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const updateSettingsSchema = z.object({
  general: z.object(
    {
      siteName: z.string({ required_error: "Tên website (siteName) không được để trống" }).trim().min(1, "Tên website (siteName) không được để trống"),
      email:    zodEmail,
      hotline:  z.string({ required_error: "Hotline không được để trống" }).trim().min(1, "Hotline không được để trống"),
      address:  z.string({ required_error: "Địa chỉ không được để trống" }).trim().min(1, "Địa chỉ không được để trống"),
    },
    { required_error: "Thiếu thông tin cấu hình chung (general)" }
  ),
  system: z
    .object({
      maintenanceMode:    zodBoolCoerce,
      allowGuestCheckout: zodBoolCoerce,
      enableVoucher:      zodBoolCoerce,
      enableReviews:      zodBoolCoerce,
    })
    .optional(),
}).passthrough(); // cho phép các field cấu hình khác đi qua

// ---------------------------------------------------------------------------
// Middleware export — tên giữ nguyên, backward compatible
// ---------------------------------------------------------------------------

export const validateUpdateSettings = validate(updateSettingsSchema);
