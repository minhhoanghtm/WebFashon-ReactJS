import Conversation from "./conversation.model.js";

class ConversationRepository {
  create(data, options = {}) {
    return Conversation.create([data], options).then((docs) => docs[0]);
  }

  findById(id, populate = "") {
    const query = Conversation.findById(id);
    if (populate) query.populate(populate);
    return query;
  }

  findOne(filter, populate = "") {
    const query = Conversation.findOne(filter);
    if (populate) query.populate(populate);
    return query;
  }

  find(filter = {}, { sort = { lastMessageAt: -1, updatedAt: -1 }, skip = 0, limit = 20, populate = "" } = {}) {
    const query = Conversation.find(filter).sort(sort).skip(skip).limit(limit);
    if (populate) query.populate(populate);
    return query.lean();
  }

  count(filter = {}) {
    return Conversation.countDocuments(filter);
  }

  updateById(id, data, options = {}) {
    return Conversation.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
      ...options,
    });
  }
}

export default new ConversationRepository();
