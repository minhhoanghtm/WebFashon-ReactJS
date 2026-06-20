import mongoose from "mongoose";
import conversationRepository from "./conversation.repository.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors/communication.errors.js";
import { validateCreateConversationDto } from "../validators/communication.validator.js";

const customerPopulate = {
  path: "customerId",
  select: "fullName email avatar_url",
};

const assertObjectId = (id, field = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError(`${field} is invalid`);
  }
};

class ConversationService {
  async createConversation(payload, options = {}) {
    const data = validateCreateConversationDto(payload);
    assertObjectId(data.customerId, "customerId");

    if (data.assignedAdminId) assertObjectId(data.assignedAdminId, "assignedAdminId");

    return conversationRepository.create(
      {
        ...data,
        lastMessageAt: null,
      },
      options
    );
  }

  async getOrCreateCustomerAiConversation(customerId, metadata = {}) {
    assertObjectId(customerId, "customerId");

    const existing = await conversationRepository.findOne({
      customerId,
      type: "ai",
      status: { $ne: "closed" },
    });

    if (existing) return existing;

    return this.createConversation({
      customerId,
      type: "ai",
      status: "open",
      source: "manual",
      metadata,
    });
  }

  async getConversationById(id, actor = {}) {
    assertObjectId(id, "conversationId");

    const conversation = await conversationRepository.findById(id, customerPopulate);
    if (!conversation) throw new NotFoundError("Conversation not found");

    if (actor.role !== "admin" && String(conversation.customerId?._id || conversation.customerId) !== String(actor.userId)) {
      throw new ForbiddenError("You do not have permission to access this conversation");
    }

    return conversation;
  }

  async listCustomerConversations(customerId, query = {}) {
    assertObjectId(customerId, "customerId");

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const filter = { customerId };

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      conversationRepository.find(filter, { skip, limit, populate: customerPopulate }),
      conversationRepository.count(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listAdminConversations(query = {}, adminId = null) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const filter = {};

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.assigned === "unassigned") filter.assignedAdminId = null;
    if (query.assigned === "my" && adminId) filter.assignedAdminId = adminId;

    const [items, total] = await Promise.all([
      conversationRepository.find(filter, { skip, limit, populate: customerPopulate }),
      conversationRepository.count(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async assignConversation(conversationId, adminId) {
    await this.getConversationById(conversationId, { role: "admin" });
    assertObjectId(adminId, "adminId");

    return conversationRepository.updateById(conversationId, {
      assignedAdminId: adminId,
      type: "support",
      status: "waiting_customer",
    });
  }

  async transferConversation(conversationId, adminId) {
    return this.assignConversation(conversationId, adminId);
  }

  async closeConversation(conversationId, actor = {}) {
    await this.getConversationById(conversationId, actor);
    if (actor.role === "admin") {
      throw new ForbiddenError("Admin is not allowed to close conversations");
    }
    return conversationRepository.updateById(conversationId, { status: "closed" });
  }

  async reopenConversation(conversationId, actor = {}) {
    await this.getConversationById(conversationId, actor);
    return conversationRepository.updateById(conversationId, { status: "open" });
  }

  async updateConversationMetadata(conversationId, metadata = {}) {
    assertObjectId(conversationId, "conversationId");
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    conversation.metadata = {
      ...(conversation.metadata || {}),
      ...metadata,
    };
    return conversationRepository.updateById(conversationId, {
      metadata: conversation.metadata,
    });
  }

  async markLastMessage(conversationId, date = new Date(), status) {
    const update = { lastMessageAt: date };
    if (status) update.status = status;
    return conversationRepository.updateById(conversationId, update);
  }
}

export default new ConversationService();
