import api from "./api";

export const addProductApi = (data) => {
    return api.post("/products", data);
}

export const getAllProductApi = () => {
    return api.get("/products");
}

export const getProductDetailByIdApi = (id) => {
    return api.get(`/products/detail/${id}`);
}

export const getProductByCategoryApi = (categoryId, limit) => {
    return api.get(`/products/category/${categoryId}?limit=${limit}`);
}

export const getProductBySlugApi = (slug) => {
    return api.get(`/products/${slug}`);
}

export const updateProductApi = (id, data) => {
    return api.put(`/products/${id}`, data);
}

export const deleteProductApi = (id) => {
    return api.delete(`/products/${id}`);
}

export const searchProductsApi = (params) => {
    // Xử lý nếu params là string (chỉ có search keyword)
    if (typeof params === 'string') {
        return api.get(`/products/search?search=${encodeURIComponent(params)}`);
    }
    // Nếu params là object (có thêm category, price, rating, sort, etc.)
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.minPrice !== null && params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice !== null && params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice);
    if (params.rating !== null && params.rating !== undefined) queryParams.append('rating', params.rating);
    if (params.sort) queryParams.append('sort', params.sort);
    
    return api.get(`/products/search?${queryParams.toString()}`);
}

export const suggestProductsApi = (query) => {
    return api.get(`/products/suggestions?keyword=${query}`);
}

export const getSlugByProductIdApi = (productId) => {
    return api.get(`/products/slug/${productId}`);
}