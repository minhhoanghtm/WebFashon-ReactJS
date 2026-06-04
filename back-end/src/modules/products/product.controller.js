import productService from "./product.service.js";
import { successResponse } from "../../common/responses/index.js";

// Product controllers
export const addProduct = async (req, res, next) => {
  try {
    const product = await productService.addProduct(req.body);
    return successResponse(res, product, "Tạo sản phẩm thành công", 201);
  } catch (error) {
    next(error);
  }
};

export const getAllProduct = async (req, res, next) => {
  try {
    const { sort, order } = req.body;
    const products = await productService.getAllProducts(sort, order);
    return successResponse(res, products);
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await productService.getProductBySlug(slug);
    return successResponse(res, product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);
    return successResponse(res, product, "Cập nhật sản phẩm thành công");
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await productService.deleteProduct(id);
    return successResponse(res, data, "Xóa sản phẩm thành công");
  } catch (error) {
    next(error);
  }
};

export const getProductByCategory = async (req, res, next) => {
  try {
    const { categoryid } = req.params;
    const products = await productService.getProductByCategory(categoryid, req.query.limit);
    return successResponse(res, products);
  } catch (error) {
    next(error);
  }
};

export const getProductDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductDetail(id);
    return successResponse(res, product);
  } catch (error) {
    next(error);
  }
};

export const suggestProducts = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    const products = await productService.suggestProducts(keyword);
    return successResponse(res, products);
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (req, res, next) => {
  try {
    const results = await productService.searchProducts(req.query);
    return res.status(200).json({
      success: true,
      data: results.products,
      pagination: results.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getSlugByProductId = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const slug = await productService.getSlugByProductId(productId);
    return successResponse(res, { slug }, "Lấy slug thành công");
  } catch (error) {
    next(error);
  }
};

// Product Variant controllers
export const createProductVariant = async (req, res, next) => {
  try {
    const variant = await productService.createVariant(req.body);
    return successResponse(res, variant, "Thêm biến thể thành công", 201);
  } catch (error) {
    next(error);
  }
};

export const updateProductVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const variant = await productService.updateVariant(id, req.body);
    return successResponse(res, variant, "Cập nhật biến thể thành công");
  } catch (error) {
    next(error);
  }
};

export const deleteProductVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const variant = await productService.deleteVariant(id);
    return successResponse(res, variant, "Xóa biến thể sản phẩm thành công");
  } catch (error) {
    next(error);
  }
};

export const getProductVariantByProductId = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    const variants = await productService.getVariantsByProductId(product_id);
    return successResponse(res, variants);
  } catch (error) {
    next(error);
  }
};

export const getProductVariantById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const variant = await productService.getVariantById(id);
    return successResponse(res, variant);
  } catch (error) {
    next(error);
  }
};
