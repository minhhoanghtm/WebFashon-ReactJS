import api from "./api";

export const getReviewsByProductIdApi = (productId) => {
    return api.get(`/reviews/${productId}`);
}

export const createReviewApi = (data) => {
    return api.post("/reviews", data);
}

export const updateReviewApi = (reviewId, data) => {
    return api.put(`/reviews/${reviewId}`, data);
}

export const deleteReviewApi = (reviewId) => {
    return api.delete(`/reviews/${reviewId}`);
}
