import categoryRepository from "./category.repository.js";
import { createSlug } from "../../common/utils/slug.js";
import { AppError } from "../../common/exceptions/AppError.js";
import Product from "../products/product.model.js";

class CategoryService {
  async getAllCategories() {
    return await categoryRepository.findAll();
  }

  async getCategoryById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new AppError("Không tìm thấy danh mục", 404);
    }
    return category;
  }

  async createCategory(categoryData) {
    const { name, image } = categoryData;
    if (!name || !image) {
      throw new AppError("Tên danh mục và hình ảnh là bắt buộc", 400);
    }
    const slug = createSlug(name);
    return await categoryRepository.create({
      name,
      image,
      slug,
    });
  }

  async updateCategory(id, categoryData) {
    const { name, image } = categoryData;
    const updateData = {};
    if (name) {
      updateData.name = name;
      updateData.slug = createSlug(name);
    }
    if (image) {
      updateData.image = image;
    }

    const updated = await categoryRepository.findByIdAndUpdate(id, updateData);
    if (!updated) {
      throw new AppError("Không tìm thấy danh mục", 404);
    }
    return updated;
  }

  async deleteCategory(id) {
    // Check if category has any products
    const hasProducts = await Product.findOne({ category_id: id }).select("_id").lean();
    if (hasProducts) {
      throw new AppError("Không thể xóa danh mục này vì vẫn còn sản phẩm thuộc danh mục", 400);
    }

    const deleted = await categoryRepository.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError("Không tìm thấy danh mục", 404);
    }
    return deleted;
  }
}

export default new CategoryService();
