import express from "express";
import {
  addProduct,
  deleteProduct,
  getAllProduct,
  getProductByCategory,
  getProductBySlug,
  getProductDetail,
  getSlugByProductId,
  searchProducts,
  suggestProducts,
  updateProduct,
  createProductVariant,
  deleteProductVariant,
  getProductVariantById,
  getProductVariantByProductId,
  updateProductVariant,
} from "./product.controller.js";

const productRouter = express.Router();

productRouter.get("/suggestions", suggestProducts);
productRouter.get("/search", searchProducts);
productRouter.get("/category/:categoryid", getProductByCategory);
productRouter.get("/detail/:id", getProductDetail);
productRouter.post("/", addProduct);
productRouter.get("/", getAllProduct);
productRouter.put("/:id", updateProduct);
productRouter.delete("/:id", deleteProduct);
productRouter.get("/:slug", getProductBySlug);
productRouter.get("/slug/:productId", getSlugByProductId);

const productVariantRouter = express.Router();

productVariantRouter.post("/", createProductVariant);
productVariantRouter.get("/:product_id", getProductVariantByProductId);
productVariantRouter.get("/item/:id", getProductVariantById); // Use /item/:id to avoid conflict, but keep fallback if needed
productVariantRouter.put("/:id", updateProductVariant);
productVariantRouter.delete("/:id", deleteProductVariant);

export { productRouter, productVariantRouter };
