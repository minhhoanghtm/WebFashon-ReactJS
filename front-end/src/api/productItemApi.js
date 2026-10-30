import axiosClient from "./axiosClient";

export const createProductVariantApi = (productVariant) => {
  return axiosClient.post("/product_variants", productVariant);
};

export const getProductVariantByProductIdApi = (productId) => {
  return axiosClient.get(`/product_variants/${productId}`);
};

export const getProductVariantByIdApi = (id) => {
  return axiosClient.get(`/product_variants/${id}`);
};

export const updateProductVariantApi = (id, productVariant) => {
  return axiosClient.put(`/product_variants/${id}`, productVariant);
};

export const deleteProductVariantApi = (id) => {
  return axiosClient.delete(`/product_variants/${id}`);
};
