import {
  createCategoryApi,
  deleteCategoryApi,
  getAllCategoriesApi,
  getCategoryApi,
  updateCategoryApi,
} from "@/api/categoryApi";

export const getAllCategoriesService = async () => {
  const response = await getAllCategoriesApi();
  const payload = response.data?.data ?? response.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

export const getCategoryByIdService = async (id) => {
  const response = await getCategoryApi(id);
  return response.data;
};

export const createCategoryService = async (data) => {
  const response = await createCategoryApi(data);
  return response.data;
};

export const updateCategoryService = async (id, data) => {
  const response = await updateCategoryApi(id, data);
  return response.data;
};

export const deleteCategoryService = async (id) => {
  const response = await deleteCategoryApi(id);
  return response.data;
};
