import Conversation from "./conversation.model.js";

class ConversationRepository {
  async find(query = {}, sort = { updatedAt: -1 }, skip = 0, limit = 20, populate = "") {
    const request = Conversation.find(query).sort(sort).skip(skip).limit(limit);
    if (populate) request.populate(populate);
    return await request.lean();
  }

  async findById(id) {
    return await Conversation.findById(id);
  }

  async findByIdLean(id, populate = "") {
    const request = Conversation.findById(id);
    if (populate) request.populate(populate);
    return await request.lean();
  }

  async create(data) {
    return await Conversation.create(data);
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await Conversation.findByIdAndUpdate(id, updateData, options);
  }

  async findOneAndUpdate(query, updateData, options = { new: true }) {
    return await Conversation.findOneAndUpdate(query, updateData, options);
  }

  async countDocuments(query = {}) {
    return await Conversation.countDocuments(query);
  }
}

export default new ConversationRepository();
