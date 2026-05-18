import api from "./api";

export const createProductVariantApi = (productVariant) => {
    return api.post("/product_variants", productVariant);
}

export const getProductVariantByProductIdApi = (productId) => {
    return api.get(`/product_variants/${productId}`);
};

export const getProductVariantByIdApi = (id) => {
    return api.get(`/product_variants/${id}`);
};

export const updateProductVariantApi = (id, productVariant) => {
    return api.put(`/product_variants/${id}`, productVariant);
}

export const deleteProductVariantApi = (id) => {
    return api.delete(`/product_variants/${id}`);
}