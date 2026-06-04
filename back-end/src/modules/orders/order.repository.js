import { Order, OrderItem } from "./order.model.js";

class OrderRepository {
  // Order methods
  async create(orderData) {
    return await Order.create(orderData);
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

  async find(query = {}, sort = { createdAt: -1 }) {
    return await Order.find(query).sort(sort);
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

  async insertManyItems(items) {
    return await OrderItem.insertMany(items);
  }

  async findItems(query = {}) {
    return await OrderItem.find(query);
  }

  async aggregateItems(pipeline) {
    return await OrderItem.aggregate(pipeline);
  }
}

export default new OrderRepository();
