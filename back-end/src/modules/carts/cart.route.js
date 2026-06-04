import express from "express";
import {
  addCart,
  getCart,
  updateCart,
  deleteCart,
  addCartItem,
  getCartItems,
  updateCartItem,
  deleteCartItem,
} from "./cart.controller.js";

const cartRouter = express.Router();
cartRouter.post("/", addCart);
cartRouter.get("/", getCart);
cartRouter.put("/:id", updateCart);
cartRouter.delete("/:id", deleteCart);

const cartItemRouter = express.Router();
cartItemRouter.post("/", addCartItem);
cartItemRouter.get("/:cartId", getCartItems);
cartItemRouter.put("/:id", updateCartItem);
cartItemRouter.delete("/:id", deleteCartItem);

export { cartRouter, cartItemRouter };
