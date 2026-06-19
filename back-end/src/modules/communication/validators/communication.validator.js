import { ValidationError } from "../errors/communication.errors.js";

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);

export const validateEnum = (value, allowed, field, required = true) => {
  if ((value === undefined || value === null || value === "") && !required) return undefined;
  if (!allowed.includes(value)) {
    throw new ValidationError(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return value;
};

export const validateString = (value, field, { required = true, max = 4000 } = {}) => {
  if ((value === undefined || value === null || value === "") && !required) return undefined;
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new ValidationError(`${field} is required`);
  if (trimmed.length > max) throw new ValidationError(`${field} must be at most ${max} characters`);
  return trimmed;
};

export const validateObject = (value, field, { required = false } = {}) => {
  if ((value === undefined || value === null) && !required) return undefined;
  if (!isObject(value)) throw new ValidationError(`${field} must be an object`);
  return value;
};

export const validateCreateConversationDto = (payload = {}) => ({
  customerId: payload.customerId,
  type: validateEnum(payload.type || "ai", ["ai", "support"], "type"),
  status: validateEnum(payload.status || "open", ["open", "waiting_admin", "waiting_customer", "closed"], "status"),
  assignedAdminId: payload.assignedAdminId,
  source: validateEnum(payload.source || "manual", ["manual", "ai_handoff"], "source"),
  metadata: validateObject(payload.metadata, "metadata", { required: false }) || {},
});

export const validateCreateMessageDto = (payload = {}) => ({
  conversationId: payload.conversationId,
  senderType: validateEnum(payload.senderType, ["user", "admin", "ai", "system"], "senderType"),
  senderId: payload.senderId,
  messageType: validateEnum(payload.messageType || "text", ["text", "image", "file", "product_card", "order_card", "system"], "messageType"),
  content: validateString(payload.content, "content", { max: 10000 }),
  metadata: validateObject(payload.metadata, "metadata", { required: false }) || {},
});

export const validateTextMessageDto = (payload = {}) => ({
  conversationId: payload.conversationId,
  content: validateString(payload.content, "content", { max: 10000 }),
  currentProductId: payload.currentProductId,
  metadata: validateObject(payload.metadata, "metadata", { required: false }) || {},
  history: Array.isArray(payload.history) ? payload.history : undefined,
});
