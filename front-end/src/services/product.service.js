import { addProductApi, deleteProductApi, getAllProductApi, getProductByCategoryApi, getProductBySlugApi, getProductDetailByIdApi, getSlugByProductIdApi, searchProductsApi, suggestProductsApi, updateProductApi } from "@/api/productApi";

export const addProductService = async (data) => {
    const res = await addProductApi(data);
    return res.data;
}


export const getAllProductService = async () => {
    const res = await getAllProductApi();
    return res.data;
}

export const getProductBySlugService = async (slug) => {
    const res = await getProductBySlugApi(slug);
    return res.data;
}

export const getProductDetailByIdService = async (id) => {
    const res = await getProductDetailByIdApi(id);
    return res.data;
}

export const getProductByCategoryService = async (categoryId) => {
    const res = await getProductByCategoryApi(categoryId);
    return res.data;
}

export const updateProductService = async (id, data) => {
    const res = await updateProductApi(id, data);
    return res.data;
}

export const deleteProductService = async (id) => {
    const res = await deleteProductApi(id);
    return res.data;
}

export const searchProductsService = async (params) => {
    const res = await searchProductsApi(params);
    return res.data;
}

export const suggestProductsService = async (query) => {
    const res = await suggestProductsApi(query);
    return res.data;
}

export const getSlugByProductIdService = async (productId) => {
    const res = await getSlugByProductIdApi(productId);
    return res.data;
}