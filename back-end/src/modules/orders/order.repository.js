import { Order, OrderItem } from "./order.model.js";

class OrderRepository {
  // Order methods
  async create(orderData, options = {}) {
    if (Array.isArray(orderData)) {
      return await Order.create(orderData, options);
    }
    // If it is a single document, avoid passing an empty options object directly to Model.create
    const docs = Object.keys(options).length > 0
      ? await Order.create([orderData], options)
      : await Order.create(orderData);
    return Array.isArray(docs) ? docs[0] : docs;
  }

  async save(orderDocument, options = {}) {
    return await orderDocument.save(options);
  }

  async findById(id, options = {}) {
    const { lean = false } = options;
    let q = Order.findById(id);
    return lean ? await q.lean() : await q;
  }

  async findOne(query, options = {}) {
    const { lean = false } = options;
    let q = Order.findOne(query);
    return lean ? await q.lean() : await q;
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await Order.findByIdAndUpdate(id, updateData, options);
  }

  async findByIdAndDelete(id) {
    return await Order.findByIdAndDelete(id);
  }

  async find(query = {}, sort = { createdAt: -1 }, skip = 0, limit = 0, options = {}) {
    const { lean = true } = options;
    let queryChain = Order.find(query).sort(sort);
    if (skip > 0) queryChain = queryChain.skip(skip);
    if (limit > 0) queryChain = queryChain.limit(limit);
    return lean ? await queryChain.lean() : await queryChain;
  }

  async countDocuments(query = {}) {
    return await Order.countDocuments(query);
  }

  async distinct(field, query = {}) {
    return await Order.distinct(field, query);
  }

  async aggregate(pipeline) {
    return await Order.aggregate(pipeline);
  }

  // OrderItem methods
  async createItem(itemData) {
    return await OrderItem.create(itemData);
  }

  async insertManyItems(items, options = {}) {
    return await OrderItem.insertMany(items, options);
  }

  async findItems(query = {}) {
    return await OrderItem.find(query);
  }

  async findItemsWithDetails(query = {}) {
    return await OrderItem.find(query)
      .populate("product_id")
      .populate("variant_id");
  }

  async findItemByIdAndUpdate(id, updateData, options = { new: true }) {
    return await OrderItem.findByIdAndUpdate(id, updateData, options);
  }

  async findItemByIdAndDelete(id) {
    return await OrderItem.findByIdAndDelete(id);
  }

  async aggregateItems(pipeline) {
    return await OrderItem.aggregate(pipeline);
  }
}

export default new OrderRepository();
