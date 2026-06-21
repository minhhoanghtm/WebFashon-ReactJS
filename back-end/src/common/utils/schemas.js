/**
 * Shared Zod primitive schemas dùng chung cho nhiều module.
 * Chỉ chứa các schema thực sự tái sử dụng — không chứa business logic.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------
export const zodEmail = z
  .string({ required_error: "Email là bắt buộc" })
  .trim()
  .min(1, "Email không được để trống")
  .email("Định dạng email không hợp lệ!");

// ---------------------------------------------------------------------------
// Password (min 6 ký tự)
// ---------------------------------------------------------------------------
export const zodPassword = z
  .string({ required_error: "Mật khẩu là bắt buộc" })
  .min(6, "Mật khẩu phải có ít nhất 6 ký tự!");

// ---------------------------------------------------------------------------
// MongoDB ObjectId (24-char hex string)
// ---------------------------------------------------------------------------
export const zodObjectId = z
  .string({ required_error: "ID là bắt buộc" })
  .regex(/^[a-f\d]{24}$/i, "ID không hợp lệ");

// ---------------------------------------------------------------------------
// Phone (9–11 chữ số)
// ---------------------------------------------------------------------------
export const zodPhone = z
  .string()
  .regex(/^[0-9]{9,11}$/, "Số điện thoại không hợp lệ! Phải có từ 9 đến 11 chữ số.");
