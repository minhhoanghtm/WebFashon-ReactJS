import axiosClient from './axiosClient';

export const productApi = {
  addProduct: (data) => axiosClient.post('/products', data),
  getAllProducts: () => axiosClient.get('/products'),
  getProductDetailById: (id) => axiosClient.get(`/products/detail/${id}`),
  getProductByCategory: (categoryId, limit) => {
    let url = `/products/category/${categoryId}`;
    if (limit) url += `?limit=${limit}`;
    return axiosClient.get(url);
  },
  getProductBySlug: (slug) => axiosClient.get(`/products/${slug}`),
  updateProduct: (id, data) => axiosClient.put(`/products/${id}`, data),
  deleteProduct: (id) => axiosClient.delete(`/products/${id}`),
  searchProducts: (params) => {
    if (typeof params === 'string') {
      return axiosClient.get(`/products/search?search=${encodeURIComponent(params)}`);
    }
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    if (params.rating) queryParams.append('rating', params.rating);
    if (params.sort) queryParams.append('sort', params.sort);

    return axiosClient.get(`/products/search?${queryParams.toString()}`);
  },
  suggestProducts: (query) => axiosClient.get(`/products/suggestions?keyword=${query}`),
  getSlugByProductId: (productId) => axiosClient.get(`/products/slug/${productId}`),
};
