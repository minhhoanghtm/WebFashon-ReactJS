import categoryService from "../../../categories/category.service.js";

export class SearchCategoryTool {
  name = "search_category";

  async execute() {
    return categoryService.getAllCategories();
  }
}
