import express from "express";
import validate from "../../middlewares/validateZod.js";
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
import { getAllProducts } from "./queries/product.query.js";

const productRouter = express.Router();

productRouter.get("/suggestions", suggestProducts);
productRouter.get("/search", validate(searchProductSchema), searchProducts);
productRouter.get("/category/:categoryid", getProductByCategory);
productRouter.get("/detail/:id", getProductDetail);
productRouter.post("/", validate(createProductSchema), addProduct);
productRouter.get("/", getAllProducts);
productRouter.put("/:id", validate(updateProductSchema), updateProduct);
productRouter.delete("/:id", deleteProduct);
productRouter.get("/:slug", getProductBySlug);
productRouter.get("/slug/:productId", getSlugByProductId);

const productVariantRouter = express.Router();

productVariantRouter.post("/", validate(createVariantSchema), createProductVariant);
productVariantRouter.get("/:product_id", getProductVariantByProductId);
productVariantRouter.get("/item/:id", getProductVariantById); // Use /item/:id to avoid conflict, but keep fallback if needed
productVariantRouter.put("/:id", validate(updateVariantSchema), updateProductVariant);
productVariantRouter.delete("/:id", deleteProductVariant);

export { productRouter, productVariantRouter };
