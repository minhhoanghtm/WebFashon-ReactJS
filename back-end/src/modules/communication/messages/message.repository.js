import Message from "./message.model.js";

class MessageRepository {
  create(data, options = {}) {
    return Message.create([data], options).then((docs) => docs[0]);
  }

  findById(id) {
    return Message.findById(id);
  }

  find(filter = {}, { sort = { createdAt: 1 }, skip = 0, limit = 50 } = {}) {
    return Message.find(filter).sort(sort).skip(skip).limit(limit).lean();
  }

  count(filter = {}) {
    return Message.countDocuments(filter);
  }

  insertMany(data, options = {}) {
    return Message.insertMany(data, options);
  }
}

export default new MessageRepository();
