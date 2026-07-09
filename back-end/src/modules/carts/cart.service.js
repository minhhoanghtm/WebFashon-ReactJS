import cartRepository from "./cart.repository.js";
import { Cart, CartItem } from "./cart.model.js";
import { AppError } from "../../common/exceptions/AppError.js";

class CartService {
  async addCart(cartData) {
    return await cartRepository.create(cartData);
  }

  async getCart(userId) {
    return await cartRepository.findByUserId(userId);
  }

  async updateCart(id, updateData) {
    const updated = await cartRepository.updateCart(id, updateData);
    if (!updated) {
      throw new AppError("Giỏ hàng không tồn tại", 404);
    }
    return updated;
  }

  async deleteCart(id) {
    const deleted = await cartRepository.deleteCart(id);
    if (!deleted) {
      throw new AppError("Giỏ hàng không tồn tại", 404);
    }
    return deleted;
  }

  async addCartItem(userId, itemData) {
    const { product_id, variant_id, quantity = 1, price } = itemData;

    if (!userId) {
      throw new AppError("Không tìm thấy thông tin người dùng", 401);
    }

    if (!product_id || price === undefined || price === null) {
      throw new AppError("Thiếu dữ liệu sản phẩm để thêm vào giỏ hàng", 400);
    }

    // 1. Get or create cart in 1 query
    const cart = await Cart.findOneAndUpdate(
      { user_id: userId },
      { $setOnInsert: { total_items: 0, total_price: 0 } },
      { upsert: true, new: true }
    );

    const cartId = cart._id;
    const normalizedVariantId = variant_id || null;

    // 2. Upsert cart item in 1 query
    await CartItem.findOneAndUpdate(
      {
        cart_id: cartId,
        product_id,
        variant_id: normalizedVariantId,
      },
      {
        $inc: { quantity: Number(quantity) },
        $setOnInsert: { price: Number(price) },
      },
      { upsert: true }
    );

    return await this._recalculateCart(cartId, false); // không cần populate khi add
  }

  async getCartItems(cartId) {
    return await cartRepository.findItemsWithDetails({ cart_id: cartId });
  }

  async updateCartItem(itemId, updateData) {
    const cartItem = await cartRepository.findItemById(itemId);
    if (!cartItem) {
      throw new AppError("Không tìm thấy sản phẩm trong giỏ hàng", 404);
    }

    await cartRepository.updateItem(itemId, updateData);
    return await this._recalculateCart(cartItem.cart_id);
  }

  async deleteCartItem(itemId) {
    const cartItem = await cartRepository.findItemById(itemId);
    if (!cartItem) {
      throw new AppError("Không tìm thấy sản phẩm trong giỏ hàng", 404);
    }

    await cartRepository.deleteItem(itemId);
    return await this._recalculateCart(cartItem.cart_id);
  }

  // Private helper to recalculate cart totals
  // populate=true: trả full item detail (dùng cho GET cart)
  // populate=false: chỉ trả totals (dùng cho add/update/delete → nhanh hơn)
  async _recalculateCart(cartId, populate = true) {
    const items = await CartItem.find({ cart_id: cartId }).select("quantity price");

    const totalItemsCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPrice = items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );

    const updatedCart = await Cart.findByIdAndUpdate(
      cartId,
      { total_items: totalItemsCount, total_price: totalPrice },
      { new: true }
    );

    // Chỉ populate khi caller thực sự cần (GET cart)
    const populatedItems = populate
      ? await cartRepository.findItemsWithDetails({ cart_id: cartId })
      : null;

    return {
      items: populatedItems,
      cart: updatedCart,
      total: totalPrice,
    };
  }
}

export default new CartService();
