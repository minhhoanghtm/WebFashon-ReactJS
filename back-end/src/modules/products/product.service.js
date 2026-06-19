import productRepository from "./product.repository.js";
import { createSlug } from "../../common/utils/slug.js";
import { toNoAccent } from "../../common/utils/removeAccents.js";
import { AppError } from "../../common/exceptions/AppError.js";
import mongoose from "mongoose";

class ProductService {
  async addProduct(productData) {
    const { name, variants = [], ...productBody } = productData;
    const slug = createSlug(name);
    const name_no_accents = toNoAccent(name);

    let finalStock = Number(productBody.stock || 0);
    if (Array.isArray(variants) && variants.length > 0) {
      finalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
    }

    const product = await productRepository.create({
      ...productBody,
      slug,
      name,
      name_no_accents,
      stock: finalStock,
    });

    if (Array.isArray(variants) && variants.length > 0) {
      const variantDocs = variants
        .filter((variant) => variant?.color && variant?.image_url)
        .map((variant) => ({
          product_id: product._id,
          color: variant.color,
          size: variant.size,
          stock: Number(variant.stock || 0),
          image_url: variant.image_url,
        }));

      if (variantDocs.length > 0) {
        await productRepository.insertManyVariants(variantDocs);
      }
    }

    return product;
  }

  async getAllProducts(sort = "createdAt", order = "desc") {
    const sortOption = {};
    sort.split(",").forEach((element) => {
      sortOption[element] = order === "asc" ? 1 : -1;
    });
    return await productRepository.findWithoutPagination({}, sortOption);
  }

  async getProductBySlug(slug) {
    const product = await productRepository.findOne({ slug });
    if (!product) {
      throw new AppError("Sản phẩm không tồn tại", 404);
    }
    return product;
  }

  async updateProduct(id, productData) {
    const { variants, ...productBody } = productData;

    let finalStock = Number(productBody.stock || 0);
    if (Array.isArray(variants) && variants.length > 0) {
      finalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
    }

    const updatedProduct = await productRepository.findByIdAndUpdate(id, {
      ...productBody,
      stock: finalStock,
    });
    if (!updatedProduct) {
      throw new AppError("Sản phẩm không tồn tại", 404);
    }

    if (Array.isArray(variants)) {
      await productRepository.deleteVariantsByProductId(new mongoose.Types.ObjectId(id));

      const variantDocs = variants
        .filter((variant) => variant?.color && variant?.image_url)
        .map((variant) => ({
          product_id: new mongoose.Types.ObjectId(id),
          color: variant.color,
          size: variant.size,
          stock: Number(variant.stock || 0),
          image_url: variant.image_url,
        }));

      if (variantDocs.length > 0) {
        await productRepository.insertManyVariants(variantDocs);
      }
    }

    return updatedProduct;
  }

  async deleteProduct(id) {
    const deletedProduct = await productRepository.findByIdAndDelete(id);
    if (!deletedProduct) {
      throw new AppError("Sản phẩm không tồn tại", 404);
    }
    await productRepository.deleteVariantsByProductId(new mongoose.Types.ObjectId(id));
    return deletedProduct;
  }

  async getProductByCategory(categoryId, limitOption = 6) {
    const limit = Math.min(Number(limitOption) || 6, 12);
    return await productRepository.find({ category_id: categoryId }, { createdAt: -1 }, 0, limit);
  }

  async getProductDetail(id) {
    const product = await productRepository.findByIdWithVariants(id);
    if (!product) {
      throw new AppError("Sản phẩm không tồn tại", 404);
    }
    return product;
  }

  async suggestProducts(keyword) {
    if (!keyword) {
      throw new AppError("Vui lòng cung cấp từ khóa gợi ý", 400);
    }
    const key = toNoAccent(keyword.trim());
    return await productRepository.find(
      {
        is_active: true,
        name_no_accents: { $regex: key, $options: "i" },
      },
      { createdAt: -1 },
      0,
      10
    );
  }

  async searchProducts(filterQuery) {
    const {
      search = "",
      page = 1,
      limit = 10,
      category,
      minPrice,
      maxPrice,
      rating,
      sort,
    } = filterQuery;

    const query = { is_active: true };

    if (search?.trim()) {
      const keyword = toNoAccent(search.trim());
      query.name_no_accents = { $regex: keyword, $options: "i" };
    }

    if (category) {
      query.category_id = { $in: category.split(",") };
    }

    if (minPrice || maxPrice) {
      query.new_price = {};
      if (minPrice) query.new_price.$gte = Number(minPrice);
      if (maxPrice) query.new_price.$lte = Number(maxPrice);
    }

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    const currentPage = Math.max(Number(page), 1);
    const perPage = Math.max(Number(limit), 1);
    const skip = (currentPage - 1) * perPage;

    let sortOption = { createdAt: -1 };
    switch (sort) {
      case "price_asc":
        sortOption = { new_price: 1 };
        break;
      case "price_desc":
        sortOption = { new_price: -1 };
        break;
      case "rating":
        sortOption = { rating: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
    }

    const [products, total] = await Promise.all([
      productRepository.find(query, sortOption, skip, perPage),
      productRepository.countDocuments(query),
    ]);

    return {
      products,
      pagination: {
        total,
        page: currentPage,
        limit: perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getSlugByProductId(productId) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new AppError("Sản phẩm không tồn tại", 404);
    }
    return product.slug;
  }

  // Variant Services
  async createVariant(variantData) {
    return await productRepository.createVariant(variantData);
  }

  async updateVariant(id, updateData) {
    const updated = await productRepository.findVariantByIdAndUpdate(id, updateData);
    if (!updated) {
      throw new AppError("Không tìm thấy biến thể sản phẩm", 404);
    }
    return updated;
  }

  async deleteVariant(id) {
    const deleted = await productRepository.findVariantByIdAndDelete(id);
    if (!deleted) {
      throw new AppError("Không tìm thấy biến thể sản phẩm", 404);
    }
    return deleted;
  }

  async getVariantsByProductId(productId) {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError("product_id không hợp lệ", 400);
    }
    return await productRepository.findVariants({
      product_id: new mongoose.Types.ObjectId(productId),
    });
  }

  async getVariantById(id) {
    const variant = await productRepository.findVariantById(id);
    if (!variant) {
      throw new AppError("Không tìm thấy biến thể sản phẩm", 404);
    }
    return variant;
  }
}

export default new ProductService();
