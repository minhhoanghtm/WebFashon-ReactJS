import {
  createProductVariantApi,
  deleteProductVariantApi,
  getProductVariantByIdApi,
  getProductVariantByProductIdApi,
  updateProductVariantApi,
} from "@/api/productItemApi";

export const getProductVariantByProductIdService = async (productId) => {
  if (!productId) {
    return [];
  }
  const response = await getProductVariantByProductIdApi(productId);
  return response.data?.data ?? response.data;
};

export const getProductVariantByIdService = async (id) => {
  const response = await getProductVariantByIdApi(id);
  return response.data?.data ?? response.data;
};

export const createProductVariantService = async (data) => {
  const response = await createProductVariantApi(data);
  return response.data;
};

export const updateProductVariantService = async (id, data) => {
  const response = await updateProductVariantApi(id, data);
  return response.data;
};

export const deleteProductVariantService = async (id) => {
  const response = await deleteProductVariantApi(id);
  return response.data;
};
