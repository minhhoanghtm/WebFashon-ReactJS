/**
 * Communication validators — Zod schema-based, utility function style.
 * KHÔNG phải Express middleware — được gọi từ service layer.
 *
 * Giữ nguyên:
 *  - Tên và signature của tất cả 3 export functions
 *  - Throw ValidationError (không thay bằng AppError) để không break communication module
 *  - Return value contract (trả về validated/normalized object)
 *
 * Chỉ thay implementation bên trong bằng Zod.
 */
import { z } from "zod";
import { ValidationError } from "../errors/communication.errors.js";

// ---------------------------------------------------------------------------
// Helper: parse và throw ValidationError nếu fail
// ---------------------------------------------------------------------------

function parseOrThrow(schema, data, contextLabel = "") {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.errors.map((e) => {
      const field = e.path.length > 0 ? e.path.join(".") + ": " : "";
      return `${field}${e.message}`;
    });
    throw new ValidationError(messages.join("; "));
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const createConversationDtoSchema = z.object({
  customerId:      z.any().optional(),
  type:            z.enum(["ai", "support"], { message: "type must be one of: ai, support" }).default("ai"),
  status:          z.enum(["open", "waiting_admin", "waiting_customer", "closed"], { message: "status must be one of: open, waiting_admin, waiting_customer, closed" }).default("open"),
  assignedAdminId: z.any().optional(),
  source:          z.enum(["manual", "ai_handoff"], { message: "source must be one of: manual, ai_handoff" }).default("manual"),
  metadata:        z.record(z.any()).optional().default({}),
});

const createMessageDtoSchema = z.object({
  conversationId: z.any().optional(),
  senderType:     z.enum(["user", "admin", "ai", "system"], { message: "senderType must be one of: user, admin, ai, system" }),
  senderId:       z.any().optional(),
  messageType:    z.enum(["text", "image", "file", "product_card", "order_card", "system"], { message: "messageType must be one of: text, image, file, product_card, order_card, system" }).default("text"),
  content:        z.string({ required_error: "content is required" }).max(10000, "content must be at most 10000 characters"),
  metadata:       z.record(z.any()).optional().default({}),
});

const textMessageDtoSchema = z.object({
  conversationId:   z.any().optional(),
  content:          z.string({ required_error: "content is required" }).max(10000, "content must be at most 10000 characters"),
  currentProductId: z.any().optional(),
  metadata:         z.record(z.any()).optional().default({}),
  history:          z.array(z.any()).optional(),
});

// ---------------------------------------------------------------------------
// Utility exports — tên và signature giữ nguyên, backward compatible
// ---------------------------------------------------------------------------

/**
 * @param {object} payload
 * @returns {object} validated DTO
 * @throws {ValidationError}
 */
export const validateCreateConversationDto = (payload = {}) =>
  parseOrThrow(createConversationDtoSchema, payload);

/**
 * @param {object} payload
 * @returns {object} validated DTO
 * @throws {ValidationError}
 */
export const validateCreateMessageDto = (payload = {}) =>
  parseOrThrow(createMessageDtoSchema, payload);

/**
 * @param {object} payload
 * @returns {object} validated DTO
 * @throws {ValidationError}
 */
export const validateTextMessageDto = (payload = {}) =>
  parseOrThrow(textMessageDtoSchema, payload);
