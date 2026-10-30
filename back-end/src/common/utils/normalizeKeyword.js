import { toNoAccent } from "./removeAccents.js";

/**
 * Chuẩn hóa từ khóa cho Mongoose Map key & tìm kiếm:
 * - toLowerCase, trim
 * - Bỏ dấu tiếng Việt
 * - Thay ký tự không phải chữ/số/khoảng trắng bằng khoảng trắng (loại bỏ ., $, v.v.)
 * - Gộp khoảng trắng liên tiếp
 * - Cắt tối đa 50 ký tự
 * - Bỏ nếu rỗng hoặc độ dài < 2 ký tự
 * - Đảm bảo không chứa "." và không bắt đầu bằng "$"
 */
export const normalizeKeyword = (text = "") => {
  if (!text || typeof text !== "string") return "";

  // 1. Bỏ dấu tiếng Việt, toLowerCase, trim
  let normalized = toNoAccent(text);

  // 2. Thay toàn bộ ký tự không phải chữ cái a-z, số 0-9 bằng khoảng trắng
  normalized = normalized.replace(/[^a-z0-9\s]/gi, " ");

  // 3. Gộp nhiều khoảng trắng thành 1 và trim 2 đầu
  normalized = normalized.replace(/\s+/g, " ").trim();

  // 4. Giới hạn tối đa 50 ký tự
  normalized = normalized.slice(0, 50).trim();

  // 5. Kiểm tra an toàn cho khóa MongoDB Map
  if (normalized.startsWith("$") || normalized.includes(".")) {
    return "";
  }

  // 6. Bỏ nếu quá ngắn (< 2 ký tự)
  if (normalized.length < 2) {
    return "";
  }

  return normalized;
};

export default normalizeKeyword;
