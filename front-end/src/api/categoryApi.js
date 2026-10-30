import axiosClient from "./axiosClient";

export const getAllCategoriesApi = () => {
  return axiosClient.get("/categories");
};

export const createCategoryApi = (category) => {
  return axiosClient.post("/categories", category);
};

export const getCategoryApi = (id) => {
  return axiosClient.get(`/categories/${id}`);
};

export const updateCategoryApi = (id, category) => {
  return axiosClient.put(`/categories/${id}`, category);
};

export const deleteCategoryApi = (id) => {
  return axiosClient.delete(`/categories/${id}`);
};
