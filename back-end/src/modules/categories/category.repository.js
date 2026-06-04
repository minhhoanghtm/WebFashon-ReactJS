import Category from "./category.model.js";

class CategoryRepository {
  async findAll() {
    return await Category.find();
  }

  async findById(id) {
    return await Category.findById(id);
  }

  async findOne(query) {
    return await Category.findOne(query);
  }

  async create(categoryData) {
    return await Category.create(categoryData);
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await Category.findByIdAndUpdate(id, updateData, options);
  }

  async findByIdAndDelete(id) {
    return await Category.findByIdAndDelete(id);
  }
}

export default new CategoryRepository();
