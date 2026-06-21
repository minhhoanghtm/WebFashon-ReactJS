/**
 * Middleware factory cho Zod validation.
 *
 * Cách dùng:
 *   import { validate } from "../../common/utils/validate.js";
 *   router.post("/signIn", validate(signInSchema), signIn);
 *
 * Khi parse thành công:
 *   req[target] = parsedData  // đã trimmed/coerced
 *
 * Khi parse thất bại:
 *   Trả về AppError 400 với message string — tương thích global error handler.
 *
 * NOTE: Tương thích Zod v4 (dùng .issues thay vì .errors)
 */
import { AppError } from "../exceptions/AppError.js";

/**
 * Map Zod issues thành array message string ngắn gọn.
 * Tương thích cả Zod v3 (.errors) và Zod v4 (.issues).
 *
 * @param {import("zod").ZodError} zodError
 * @returns {string[]}
 */
function mapZodIssues(zodError) {
  const issues = zodError.issues ?? zodError.errors ?? [];
  return issues.map((e) => {
    const field = e.path && e.path.length > 0 ? e.path.join(".") + ": " : "";
    return `${field}${e.message}`;
  });
}

/**
 * @param {import("zod").ZodTypeAny} schema  — Zod schema cần validate
 * @param {"body"|"params"|"query"} target   — phần của request cần validate
 */
export const validate = (schema, target = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const messages = mapZodIssues(result.error);
      return next(new AppError(messages.join("; "), 400));
    }

    // Gán lại parsed/coerced data để downstream handlers dùng
    req[target] = result.data;
    next();
  };
};

/**
 * Utility: parse synchronously, throw AppError on failure.
 * Dùng cho service-layer validators (không phải middleware).
 *
 * @param {import("zod").ZodTypeAny} schema
 * @param {any} data
 * @returns {any} parsed data
 * @throws {AppError}
 */
export function parseOrThrowAppError(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = mapZodIssues(result.error);
    throw new AppError(messages.join("; "), 400);
  }
  return result.data;
}

// Export mapZodIssues for use in custom validators
export { mapZodIssues };
