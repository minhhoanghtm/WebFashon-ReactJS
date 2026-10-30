import axiosClient from "./axiosClient";

export const addProductApi = (data) => {
  return axiosClient.post("/products", data);
};

export const getAllProductApi = () => {
  return axiosClient.get("/products");
};

export const getProductDetailByIdApi = (id) => {
  return axiosClient.get(`/products/detail/${id}`);
};

export const getProductByCategoryApi = (categoryId, limit) => {
  let url = `/products/category/${categoryId}`;
  if (limit !== undefined && limit !== null) {
    url += `?limit=${limit}`;
  }
  return axiosClient.get(url);
};

export const getProductBySlugApi = (slug) => {
  return axiosClient.get(`/products/${slug}`);
};

export const updateProductApi = (id, data) => {
  return axiosClient.put(`/products/${id}`, data);
};

export const deleteProductApi = (id) => {
  return axiosClient.delete(`/products/${id}`);
};

export const searchProductsApi = (params) => {
  if (typeof params === "string") {
    return axiosClient.get(`/products/search?search=${encodeURIComponent(params)}`);
  }
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append("search", params.search);
  if (params.category) queryParams.append("category", params.category);
  if (params.minPrice !== null && params.minPrice !== undefined) queryParams.append("minPrice", params.minPrice);
  if (params.maxPrice !== null && params.maxPrice !== undefined) queryParams.append("maxPrice", params.maxPrice);
  if (params.rating !== null && params.rating !== undefined) queryParams.append("rating", params.rating);
  if (params.sort) queryParams.append("sort", params.sort);
  if (params.semantic !== undefined && params.semantic !== null) queryParams.append("semantic", params.semantic);

  return axiosClient.get(`/products/search?${queryParams.toString()}`);
};

export const suggestProductsApi = (query) => {
  return axiosClient.get(`/products/suggestions?keyword=${query}`);
};

export const getSlugByProductIdApi = (productId) => {
  return axiosClient.get(`/products/slug/${productId}`);
};
