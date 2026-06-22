import productFacade from "../../../products/product.facade.js";

export class SearchProductTool {
  name = "search_product";

  async execute({ keyword, productId }) {
    if (productId) return productFacade.getProductDetail(productId);
    if (keyword) return productFacade.suggestProducts(keyword);
    return productFacade.getAllProducts();
  }
}
