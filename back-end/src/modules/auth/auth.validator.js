/**
 * Auth validators — Zod schema-based.
 * Backwards compatible with existing exports while supporting SMS OTP and Phone Auth.
 */
import { z } from "zod";
import { validate } from "../../common/utils/validate.js";
import { zodEmail, zodPassword } from "../../common/utils/schemas.js";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const signUpSchema = z.object({
  email: zodEmail.optional(),
  phone: z.string().optional(),
  passWord: zodPassword,
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  fullName: z.string().trim().optional(),
  birthday: z.string().optional(),
  sex: z.enum(["male", "female"], { message: "Giới tính không hợp lệ" }).optional(),
});

const signInSchema = z
  .object({
    email: z.string().optional(),
    phone: z.string().optional(),
    emailOrPhone: z.string().optional(),
    passWord: z
      .string({ required_error: "Mật khẩu là bắt buộc" })
      .min(1, "Mật khẩu không được để trống"),
  })
  .refine((data) => data.email || data.phone || data.emailOrPhone, {
    message: "Vui lòng nhập email hoặc số điện thoại.",
    path: ["emailOrPhone"],
  });

const sendOTPSchema = z.object({
  email: zodEmail,
});

const verifyOTPSchema = z.object({
  email: zodEmail,
  otp: z.string({ required_error: "OTP là bắt buộc" }).min(1, "OTP không được để trống"),
});

const resetPasswordSchema = z.object({
  email: zodEmail,
  otp: z.string({ required_error: "OTP là bắt buộc" }).min(1, "OTP không được để trống"),
  newPassword: zodPassword.superRefine((val, ctx) => {
    if (val.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 6,
        type: "string",
        inclusive: true,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự!",
      });
    }
  }),
});

// ---------------------------------------------------------------------------
// New SMS & OTP Schemas
// ---------------------------------------------------------------------------

const sendRegisterOtpSchema = z.object({
  phone: z
    .string({ required_error: "Số điện thoại là bắt buộc" })
    .trim()
    .min(9, "Số điện thoại phải có ít nhất 9 chữ số"),
  channel: z.enum(["sms", "email"]).optional(),
});

const verifyRegisterSchema = z.object({
  phone: z
    .string({ required_error: "Số điện thoại là bắt buộc" })
    .trim()
    .min(9, "Số điện thoại phải có ít nhất 9 chữ số"),
  otp: z
    .string({ required_error: "Mã OTP là bắt buộc" })
    .trim()
    .length(6, "Mã OTP phải gồm 6 chữ số"),
  fullName: z
    .string({ required_error: "Họ và tên là bắt buộc" })
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  passWord: z
    .string({ required_error: "Mật khẩu là bắt buộc" })
    .min(8, "Mật khẩu phải có độ dài tối thiểu 8 ký tự"),
  email: z.string().email("Định dạng email không hợp lệ").optional().or(z.literal("")),
  birthday: z.string().optional(),
  sex: z.enum(["male", "female"]).optional(),
});

const sendLoginOtpSchema = z.object({
  phone: z
    .string({ required_error: "Số điện thoại là bắt buộc" })
    .trim()
    .min(9, "Số điện thoại phải có ít nhất 9 chữ số"),
});

const verifyLoginOtpSchema = z.object({
  phone: z
    .string({ required_error: "Số điện thoại là bắt buộc" })
    .trim()
    .min(9, "Số điện thoại phải có ít nhất 9 chữ số"),
  otp: z
    .string({ required_error: "Mã OTP là bắt buộc" })
    .trim()
    .length(6, "Mã OTP phải gồm 6 chữ số"),
});

const forgotPasswordSchema = z
  .object({
    identifier: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    channel: z.string().optional(),
  })
  .refine((data) => data.identifier || data.phone || data.email, {
    message: "Vui lòng nhập số điện thoại hoặc email",
    path: ["identifier"],
  });

const resetPasswordWithOtpSchema = z
  .object({
    identifier: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    otp: z
      .string({ required_error: "Mã OTP là bắt buộc" })
      .trim()
      .length(6, "Mã OTP phải gồm 6 chữ số"),
    newPassword: z
      .string({ required_error: "Mật khẩu mới là bắt buộc" })
      .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
  })
  .refine((data) => data.identifier || data.phone || data.email, {
    message: "Vui lòng cung cấp số điện thoại hoặc email",
    path: ["identifier"],
  });

const resendOtpSchema = z
  .object({
    identifier: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    purpose: z.enum(["register", "login", "reset_password", "verify_phone"], {
      message: "Mục đích OTP không hợp lệ",
    }),
  })
  .refine((data) => data.identifier || data.phone || data.email, {
    message: "Vui lòng cung cấp số điện thoại hoặc email",
    path: ["identifier"],
  });

// ---------------------------------------------------------------------------
// Middleware exports
// ---------------------------------------------------------------------------

export const validateSignUp = validate(signUpSchema);
export const validateSignIn = validate(signInSchema);
export const validateSendOTP = validate(sendOTPSchema);
export const validateVerifyOTP = validate(verifyOTPSchema);
export const validateResetPassword = validate(resetPasswordSchema);

export const validateSendRegisterOtp = validate(sendRegisterOtpSchema);
export const validateVerifyRegister = validate(verifyRegisterSchema);
export const validateSendLoginOtp = validate(sendLoginOtpSchema);
export const validateVerifyLoginOtp = validate(verifyLoginOtpSchema);
export const validateForgotPassword = validate(forgotPasswordSchema);
export const validateResetPasswordWithOtp = validate(resetPasswordWithOtpSchema);
export const validateResendOtp = validate(resendOtpSchema);
