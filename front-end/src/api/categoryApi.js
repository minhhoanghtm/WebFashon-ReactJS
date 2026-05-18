import api from "./api";

export const getAllCategoriesApi = () => {
    return api.get("/categories");
}

export const createCategoryApi = (category) => {
    return api.post("/categories", category);
}

export const getCategoryApi = (id) => {
    return api.get(`/categories/${id}`);
}

export const updateCategoryApi = (id, category) => {
    return api.put(`/categories/${id}`, category);
}

export const deleteCategoryApi = (id) => {
    return api.delete(`/categories/${id}`);
}