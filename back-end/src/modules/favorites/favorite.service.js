import mongoose from "mongoose";
import Favorite from "./favorite.model.js";
import Product from "../products/product.model.js";
import { AppError } from "../../common/exceptions/AppError.js";

const populateProduct = {
  path: "product_id",
  select: "name slug displayProduct category_id old_price new_price rating is_active description",
  populate: {
    path: "category_id",
    select: "name",
    options: { strictPopulate: false },
  },
};

class FavoriteService {
  async getFavorites(userId) {
    return await Favorite.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .populate(populateProduct)
      .lean();
  }

  async addFavorite(userId, productId) {
    await this.ensureValidProduct(productId);

    try {
      await Favorite.create({
        user_id: userId,
        product_id: productId,
      });
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
    }

    return await this.getFavorites(userId);
  }

  async removeFavorite(userId, productId) {
    await Favorite.findOneAndDelete({
      user_id: userId,
      product_id: productId,
    });

    return await this.getFavorites(userId);
  }

  async toggleFavorite(userId, productId) {
    await this.ensureValidProduct(productId);

    const existing = await Favorite.findOne({
      user_id: userId,
      product_id: productId,
    });

    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      return {
        isFavorite: false,
        items: await this.getFavorites(userId),
      };
    }

    await Favorite.create({
      user_id: userId,
      product_id: productId,
    });

    return {
      isFavorite: true,
      items: await this.getFavorites(userId),
    };
  }

  async clearFavorites(userId) {
    await Favorite.deleteMany({ user_id: userId });
    return [];
  }

  async ensureValidProduct(productId) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError("ID sản phẩm không hợp lệ", 400);
    }

    const product = await Product.findById(productId).select("_id is_active").lean();
    if (!product) {
      throw new AppError("Sản phẩm không tồn tại", 404);
    }

    return product;
  }
}

export default new FavoriteService();
