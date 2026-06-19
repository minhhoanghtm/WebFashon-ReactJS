import express from "express";
import {
  addFavorite,
  clearFavorites,
  getFavorites,
  removeFavorite,
  toggleFavorite,
} from "./favorite.controller.js";

const favoriteRouter = express.Router();

favoriteRouter.get("/", getFavorites);
favoriteRouter.post("/", addFavorite);
favoriteRouter.post("/toggle", toggleFavorite);
favoriteRouter.delete("/", clearFavorites);
favoriteRouter.delete("/:productId", removeFavorite);

export default favoriteRouter;
