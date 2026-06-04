import cartRepository from "./cart.repository.js";
import { AppError } from "../../common/exceptions/AppError.js";
import { CartItem } from "./cart.model.js";

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

    let cart = await cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await cartRepository.create({ user_id: userId });
    }

    const cartId = cart._id;
    const normalizedVariantId = variant_id || null;

    const existingItem = await cartRepository.findOneItem({
      cart_id: cartId,
      product_id,
      variant_id: normalizedVariantId,
    });

    if (existingItem) {
      existingItem.quantity += Number(quantity);
      await existingItem.save();
    } else {
      await cartRepository.createItem({
        cart_id: cartId,
        product_id,
        variant_id: normalizedVariantId,
        quantity: Number(quantity),
        price: Number(price),
      });
    }

    return await this._recalculateCart(cartId);
  }

  async getCartItems(cartId) {
    return await CartItem.find({ cart_id: cartId })
      .populate("product_id")
      .populate({
        path: "variant_id",
        options: { strictPopulate: false },
      });
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

  // Private helper to recalculate cart items and update cart totals
  async _recalculateCart(cartId) {
    const updatedItems = await CartItem.find({ cart_id: cartId })
      .populate("product_id")
      .populate({
        path: "variant_id",
        options: { strictPopulate: false },
      });

    const totalItemsCount = updatedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);

    const updatedCart = await cartRepository.updateCart(
      cartId,
      {
        total_items: totalItemsCount,
        total_price: totalPrice,
      },
      { new: true }
    );

    return {
      items: updatedItems,
      cart: updatedCart,
      total: totalPrice,
    };
  }
}

export default new CartService();
