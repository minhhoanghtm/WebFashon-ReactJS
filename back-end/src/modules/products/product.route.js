import express from "express";
import validate from "../../middlewares/validateZod.js";
import { protectedRoute, adminOnly } from "../../middlewares/auth.middleware.js";
import { createProductSchema, updateProductSchema, searchProductSchema, createVariantSchema, updateVariantSchema } from "./productValidators.js";
import {
  addProduct,
  deleteProduct,
  getProducts,
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
productRouter.get("/search", validate(searchProductSchema), searchProducts);
productRouter.get("/category/:categoryid", getProductByCategory);
productRouter.get("/detail/:id", getProductDetail);
productRouter.post("/", protectedRoute, adminOnly, validate(createProductSchema), addProduct);
productRouter.get("/", getProducts);
productRouter.put("/:id", protectedRoute, adminOnly, validate(updateProductSchema), updateProduct);
productRouter.delete("/:id", protectedRoute, adminOnly, deleteProduct);
productRouter.get("/:slug", getProductBySlug);
productRouter.get("/slug/:productId", getSlugByProductId);

const productVariantRouter = express.Router();

productVariantRouter.post("/", protectedRoute, adminOnly, validate(createVariantSchema), createProductVariant);
productVariantRouter.get("/:product_id", getProductVariantByProductId);
productVariantRouter.get("/item/:id", getProductVariantById); // Use /item/:id to avoid conflict, but keep fallback if needed
productVariantRouter.put("/:id", protectedRoute, adminOnly, validate(updateVariantSchema), updateProductVariant);
productVariantRouter.delete("/:id", protectedRoute, adminOnly, deleteProductVariant);

export { productRouter, productVariantRouter };
