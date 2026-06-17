import Message from "./message.model.js";

class MessageRepository {
  async find(query = {}, sort = { createdAt: 1 }, skip = 0, limit = 50) {
    return await Message.find(query).sort(sort).skip(skip).limit(limit).lean();
  }

  async findById(id) {
    return await Message.findById(id);
  }

  async findByIdLean(id) {
    return await Message.findById(id).lean();
  }

  async create(data) {
    return await Message.create(data);
  }

  async countDocuments(query = {}) {
    return await Message.countDocuments(query);
  }
}

export default new MessageRepository();
