import { Cart, CartItem } from "./cart.model.js";

class CartRepository {
  // Cart methods
  async findByUserId(userId) {
    return await Cart.findOne({ user_id: userId });
  }

  async create(cartData) {
    return await Cart.create(cartData);
  }

  async findById(id) {
    return await Cart.findById(id);
  }

  async updateCart(id, updateData, options = { new: true }) {
    return await Cart.findByIdAndUpdate(id, updateData, options);
  }

  async deleteCart(id) {
    return await Cart.findByIdAndDelete(id);
  }

  // CartItem methods
  async findItems(query = {}) {
    return await CartItem.find(query);
  }

  async findItemById(id) {
    return await CartItem.findById(id);
  }

  async findOneItem(query) {
    return await CartItem.findOne(query);
  }

  async createItem(itemData) {
    return await CartItem.create(itemData);
  }

  async updateItem(id, updateData, options = { new: true }) {
    return await CartItem.findByIdAndUpdate(id, updateData, options);
  }

  async deleteItem(id) {
    return await CartItem.findByIdAndDelete(id);
  }

  async deleteItems(query = {}) {
    return await CartItem.deleteMany(query);
  }
}

export default new CartRepository();
