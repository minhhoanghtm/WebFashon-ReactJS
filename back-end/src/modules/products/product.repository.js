// src/modules/products/product.repository.js

import { Product, ProductVariant } from "./product.model.js";

class ProductRepository {
  // ---------- Product methods ----------
  async find(query = {}, sort = { createdAt: -1 }, skip = 0, limit = 10) {
    return await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("variants")
      .lean();
  }

  // Paginated find with optional session and index hint
  async findPaginated(query = {}, sort = { createdAt: -1 }, skip = 0, limit = 10, options = {}) {
    const { session, hint } = options;
    let q = Product.find(query).sort(sort).skip(skip).limit(limit).populate("variants");
    if (session) q = q.session(session);
    if (hint) q = q.hint(hint);
    return await q.lean();
  }

  async findWithoutPagination(query = {}, sort = { createdAt: -1 }) {
    return await Product.find(query).sort(sort).populate("variants").lean();
  }

  async findById(id, options = {}) {
    const { session } = options;
    let q = Product.findById(id);
    if (session) q = q.session(session);
    return await q;
  }

  async findByIdWithVariants(id, options = {}) {
    const { session } = options;
    let q = Product.findById(id).populate("variants");
    if (session) q = q.session(session);
    return await q;
  }

  async findOne(query, options = {}) {
    const { session } = options;
    let q = Product.findOne(query);
    if (session) q = q.session(session);
    return await q;
  }

  async create(productData, options = {}) {
    const { session } = options;
    if (session) {
      const docs = await Product.create([productData], { session });
      return docs[0];
    }
    return await Product.create(productData);
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await Product.findByIdAndUpdate(id, updateData, options);
  }

  async findByIdAndDelete(id, options = {}) {
    const { session } = options;
    if (session) {
      return await Product.findByIdAndDelete(id).session(session);
    }
    return await Product.findByIdAndDelete(id);
  }

  async countDocuments(query = {}) {
    return await Product.countDocuments(query);
  }

  // ---------- Variant methods ----------
  async createVariant(variantData, options = {}) {
    const { session } = options;
    const variant = new ProductVariant(variantData);
    if (session) return await variant.save({ session });
    return await variant.save();
  }

  async findVariants(query = {}, options = {}) {
    const { session } = options;
    let q = ProductVariant.find(query).lean();
    if (session) q = q.session(session);
    return await q;
  }

  async findVariantById(id, options = {}) {
    const { session } = options;
    let q = ProductVariant.findById(id);
    if (session) q = q.session(session);
    return await q;
  }

  async findVariantByIdAndUpdate(id, updateData, options = { new: true }) {
    return await ProductVariant.findByIdAndUpdate(id, updateData, options);
  }

  async findVariantByIdAndDelete(id, options = {}) {
    const { session } = options;
    let q = ProductVariant.findByIdAndDelete(id);
    if (session) q = q.session(session);
    return await q;
  }

  async deleteVariantsByProductId(productId, options = {}) {
    const { session } = options;
    let q = ProductVariant.deleteMany({ product_id: productId });
    if (session) q = q.session(session);
    return await q;
  }

  async insertManyVariants(variantDocs, options = {}) {
    const { session } = options;
    if (session) {
      return await ProductVariant.insertMany(variantDocs, { ordered: false, session });
    }
    return await ProductVariant.insertMany(variantDocs, { ordered: false });
  }
}

export default new ProductRepository();
