import { Product, ProductVariant } from "./product.model.js";

class ProductRepository {
  // Product methods
  async find(query = {}, sort = { createdAt: -1 }, skip = 0, limit = 10) {
    return await Product.find(query).sort(sort).skip(skip).limit(limit).lean();
  }

  async findWithoutPagination(query = {}, sort = { createdAt: -1 }) {
    return await Product.find(query).sort(sort).lean();
  }

  async findById(id) {
    return await Product.findById(id);
  }

  async findByIdWithVariants(id) {
    return await Product.findById(id).populate("variants");
  }

  async findOne(query) {
    return await Product.findOne(query);
  }

  async create(productData) {
    return await Product.create(productData);
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await Product.findByIdAndUpdate(id, updateData, options);
  }

  async findByIdAndDelete(id) {
    return await Product.findByIdAndDelete(id);
  }

  async countDocuments(query = {}) {
    return await Product.countDocuments(query);
  }

  // Variant methods
  async createVariant(variantData) {
    const variant = new ProductVariant(variantData);
    return await variant.save();
  }

  async findVariants(query = {}) {
    return await ProductVariant.find(query).lean();
  }

  async findVariantById(id) {
    return await ProductVariant.findById(id);
  }

  async findVariantByIdAndUpdate(id, updateData, options = { new: true }) {
    return await ProductVariant.findByIdAndUpdate(id, updateData, options);
  }

  async findVariantByIdAndDelete(id) {
    return await ProductVariant.findByIdAndDelete(id);
  }

  async deleteVariantsByProductId(productId) {
    return await ProductVariant.deleteMany({ product_id: productId });
  }

  async insertManyVariants(variantDocs) {
    return await ProductVariant.insertMany(variantDocs, { ordered: false });
  }
}

export default new ProductRepository();
