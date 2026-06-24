import cartService from "./cart.service.js";
import { successResponse } from "../../common/responses/index.js";

// Cart management
export const addCart = async (req, res, next) => {
  try {
    const cart = await cartService.addCart(req.body);
    return successResponse(res, cart, "Thêm vào giỏ hàng thành công");
  } catch (error) {
    next(error);
  }
};

export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const cartItems = await cartService.getCart(userId);
    return successResponse(res, cartItems);
  } catch (error) {
    next(error);cart.service.js
  }
};

export const updateCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cart = await cartService.updateCart(id, req.body);
    return successResponse(res, cart, "Cập nhật giỏ hàng thành công");
  } catch (error) {
    next(error);
  }
};

export const deleteCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    await cartService.deleteCart(id);
    return successResponse(res, null, "Xóa khỏi giỏ hàng thành công");
  } catch (error) {
    next(error);
  }
};

// Cart Item management
export const addCartItem = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { items, cart, total } = await cartService.addCartItem(userId, req.body);
    return res.status(200).json({
      success: true,
      message: "Thêm vào giỏ hàng thành công",
      data: items,
      cart,
    });
  } catch (error) {
    next(error);
  }
};

export const getCartItems = async (req, res, next) => {
  try {
    const { cartId } = req.params;
    const cartItems = await cartService.getCartItems(cartId);
    return successResponse(res, cartItems);
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, cart, total } = await cartService.updateCartItem(id, req.body);
    return res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm trong giỏ hàng thành công",
      data: items,
      cart,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, cart, total } = await cartService.deleteCartItem(id);
    return res.status(200).json({
      success: true,
      message: "Xóa sản phẩm khỏi giỏ hàng thành công",
      data: items,
      cart,
      total,
    });
  } catch (error) {
    next(error);
  }
};
