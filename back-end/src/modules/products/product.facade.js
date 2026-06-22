import * as productQueries from "./queries/product.query.js";
import { addProduct } from "./commands/createProduct.command.js";
import { updateProduct } from "./commands/updateProduct.command.js";
import { deleteProduct } from "./commands/deleteProduct.command.js";
import { deductStock, restoreStock } from "./commands/stock.command.js";

class ProductFacade {
  // Commands
  async addProduct(productData) {
    return await addProduct(productData);
  }

  async createProduct(productData) {
    return await addProduct(productData);
  }

  async updateProduct(id, productData) {
    return await updateProduct(id, productData);
  }

  async deleteProduct(id) {
    return await deleteProduct(id);
  }

  async deductStock(items, session = null) {
    return await deductStock(items, session);
  }

  async restoreStock(items, session = null) {
    return await restoreStock(items, session);
  }

  // Queries & Variant Management (both under queries/product.query.js)
  async getAllProducts(sort, order) {
    return await productQueries.getAllProducts(sort, order);
  }

  async getProductDetail(id) {
    return await productQueries.getProductDetail(id);
  }

  async getProductBySlug(slug) {
    return await productQueries.getProductBySlug(slug);
  }

  async searchProducts(filterQuery) {
    return await productQueries.searchProducts(filterQuery);
  }

  async suggestProducts(keyword) {
    return await productQueries.suggestProducts(keyword);
  }

  async getProductByCategory(categoryId, limitOption) {
    return await productQueries.getProductByCategory(categoryId, limitOption);
  }

  async getSlugByProductId(productId) {
    return await productQueries.getSlugByProductId(productId);
  }

  async getProductDetailForChat(id) {
    return await productQueries.getProductDetailForChat(id);
  }

  // Variants
  async createVariant(variantData) {
    return await productQueries.createVariant(variantData);
  }

  async updateVariant(id, updateData) {
    return await productQueries.updateVariant(id, updateData);
  }

  async deleteVariant(id) {
    return await productQueries.deleteVariant(id);
  }

  async getVariantsByProductId(productId) {
    return await productQueries.getVariantsByProductId(productId);
  }

  async getVariantById(id) {
    return await productQueries.getVariantById(id);
  }
}

export default new ProductFacade();
