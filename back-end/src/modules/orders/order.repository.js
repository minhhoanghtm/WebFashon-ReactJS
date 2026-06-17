import { Order, OrderItem } from "./order.model.js";

class OrderRepository {
  // Order methods
  async create(orderData, options = {}) {
    return await Order.create(orderData, options);
  }

  async save(orderDocument, options = {}) {
    return await orderDocument.save(options);
  }

  async findById(id) {
    return await Order.findById(id);
  }

  async findOne(query) {
    return await Order.findOne(query);
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await Order.findByIdAndUpdate(id, updateData, options);
  }

  async findByIdAndDelete(id) {
    return await Order.findByIdAndDelete(id);
  }

  async find(query = {}, sort = { createdAt: -1 }, skip = 0, limit = 0) {
    let queryChain = Order.find(query).sort(sort);
    if (skip > 0) queryChain = queryChain.skip(skip);
    if (limit > 0) queryChain = queryChain.limit(limit);
    return await queryChain;
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
