/**
 * User validators — Zod schema-based.
 * Giữ nguyên tất cả tên export để không break user.route.js.
 */
import { z } from "zod";
import { validate } from "../../common/utils/validate.js";
import { AppError } from "../../common/exceptions/AppError.js";
import { zodEmail, zodPassword, zodObjectId, zodPhone } from "../../common/utils/schemas.js";

// ---------------------------------------------------------------------------
// Reused enum schemas
// ---------------------------------------------------------------------------

const sexEnum    = z.enum(["male", "female"],  { message: "Giới tính không hợp lệ! Chỉ chấp nhận: male, female" });
const roleEnum   = z.enum(["user", "admin"],   { message: "Role không hợp lệ! Chỉ chấp nhận: user, admin" });
const statusEnum = z.enum(["active", "blocked"], { message: "Trạng thái không hợp lệ! Chỉ chấp nhận: active, blocked" });

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createUserSchema = z.object({
  email:    zodEmail,
  passWord: zodPassword,
  fullName: z.string({ required_error: "fullName là bắt buộc" }).trim().min(1, "fullName không được để trống"),
  role:     roleEnum.optional(),
  sex:      sexEnum.optional(),
});

// Schemas cho updateUser: params + body riêng biệt
const updateUserParamsSchema = z.object({
  id: zodObjectId,
});

const updateUserBodySchema = z.object({
  email:    zodEmail.optional(),
  passWord: zodPassword.optional(),
  role:     roleEnum.optional(),
  sex:      sexEnum.optional(),
  status:   statusEnum.optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string({ required_error: "Mật khẩu hiện tại là bắt buộc" }).min(1, "Mật khẩu hiện tại không được để trống"),
  newPassword:     zodPassword,
});

// Address item schema
const addressItemSchema = z.object({
  phone: zodPhone.optional(),
}).passthrough();

const updateProfileSchema = z.object({
  email:     zodEmail.optional(),
  fullName:  z.string().trim().optional(),
  sex:       sexEnum.optional(),
  birthday:  z.string().optional(),
  address:   addressItemSchema.optional(),
  addresses: z.array(addressItemSchema).optional(),
}).passthrough();

const userIdParamSchema = z.object({
  id: zodObjectId,
});

// ---------------------------------------------------------------------------
// Helper: parse và trả về lỗi đồng bộ
// ---------------------------------------------------------------------------
function parseOrError(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const messages = issues.map((e) => {
      const field = e.path.length > 0 ? e.path.join(".") + ": " : "";
      return `${field}${e.message}`;
    });
    return { error: new AppError(messages.join("; "), 400), data: null };
  }
  return { error: null, data: result.data };
}

// ---------------------------------------------------------------------------
// Middleware exports — tên giữ nguyên, backward compatible với user.route.js
// ---------------------------------------------------------------------------

export const validateCreateUser = validate(createUserSchema);

// validateUpdateUser: validate cả params.id và body
export const validateUpdateUser = (req, res, next) => {
  const paramsResult = parseOrError(updateUserParamsSchema, req.params);
  if (paramsResult.error) return next(paramsResult.error);

  const bodyResult = parseOrError(updateUserBodySchema, req.body);
  if (bodyResult.error) return next(bodyResult.error);

  req.params = paramsResult.data;
  req.body   = bodyResult.data;
  next();
};

export const validateUpdatePassword = validate(updatePasswordSchema);
export const validateUpdateProfile  = validate(updateProfileSchema);
export const validateUserIdParam    = validate(userIdParamSchema, "params");
