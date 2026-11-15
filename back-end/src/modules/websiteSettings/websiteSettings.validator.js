/**
 * WebsiteSettings validators — Zod schema-based.
 * Giữ nguyên tên export để không break websiteSettings.route.js.
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
  general: z
    .object({
      siteName: z.string().trim().min(1, "Tên website không được để trống").optional(),
      email:    zodEmail.optional(),
      hotline:  z.string().trim().min(1, "Hotline không được để trống").optional(),
      address:  z.string().trim().min(1, "Địa chỉ không được để trống").optional(),
    })
    .passthrough()
    .optional(),
  system: z
    .object({
      maintenanceMode:    zodBoolCoerce,
      maintenanceMessage: z.string().optional().nullable(),
      maintenanceUntil:   z.union([z.string(), z.date(), z.null()]).optional(),
      allowGuestCheckout: zodBoolCoerce,
      enableVoucher:      zodBoolCoerce,
      enableReviews:      zodBoolCoerce,
    })
    .passthrough()
    .optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Middleware export
// ---------------------------------------------------------------------------

export const validateUpdateSettings = validate(updateSettingsSchema);
