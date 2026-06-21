/**
 * Auth validators — Zod schema-based.
 * Giữ nguyên tất cả tên export để không break auth.route.js.
 */
import { z } from "zod";
import { validate } from "../../common/utils/validate.js";
import { zodEmail, zodPassword } from "../../common/utils/schemas.js";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const signUpSchema = z.object({
  email:     zodEmail,
  passWord:  zodPassword,
  firstName: z.string({ required_error: "firstName là bắt buộc" }).trim().min(1, "firstName không được để trống"),
  lastName:  z.string({ required_error: "lastName là bắt buộc" }).trim().min(1, "lastName không được để trống"),
  birthday:  z.string().optional(),
  sex:       z.enum(["male", "female"], { message: "Giới tính không hợp lệ" }).optional(),
});

const signInSchema = z.object({
  email:    zodEmail,
  passWord: z.string({ required_error: "Mật khẩu là bắt buộc" }).min(1, "Mật khẩu không được để trống"),
});

const sendOTPSchema = z.object({
  email: zodEmail,
});

const verifyOTPSchema = z.object({
  email: zodEmail,
  otp:   z.string({ required_error: "OTP là bắt buộc" }).min(1, "OTP không được để trống"),
});

const resetPasswordSchema = z.object({
  email:       zodEmail,
  otp:         z.string({ required_error: "OTP là bắt buộc" }).min(1, "OTP không được để trống"),
  newPassword: zodPassword.superRefine((val, ctx) => {
    if (val.length < 6) {
      ctx.addIssue({ code: z.ZodIssueCode.too_small, minimum: 6, type: "string", inclusive: true, message: "Mật khẩu mới phải có ít nhất 6 ký tự!" });
    }
  }),
});

// ---------------------------------------------------------------------------
// Middleware exports — tên giữ nguyên, backward compatible với auth.route.js
// ---------------------------------------------------------------------------

export const validateSignUp        = validate(signUpSchema);
export const validateSignIn        = validate(signInSchema);
export const validateSendOTP       = validate(sendOTPSchema);
export const validateVerifyOTP     = validate(verifyOTPSchema);
export const validateResetPassword = validate(resetPasswordSchema);
