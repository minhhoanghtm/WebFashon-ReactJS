import productService from "../../../products/product.service.js";

export class SearchProductTool {
  name = "search_product";

  async execute({ keyword, productId }) {
    if (productId) return productService.getProductDetail(productId);
    if (keyword) return productService.suggestProducts(keyword);
    return productService.getAllProducts();
  }
}
