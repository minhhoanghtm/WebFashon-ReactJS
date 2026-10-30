import axiosClient from "./axiosClient";

export const getReviewsByProductIdApi = (productId) => {
  return axiosClient.get(`/reviews/${productId}`);
};

export const createReviewApi = (data) => {
  return axiosClient.post("/reviews", data);
};

export const updateReviewApi = (reviewId, data) => {
  return axiosClient.put(`/reviews/${reviewId}`, data);
};

export const deleteReviewApi = (reviewId) => {
  return axiosClient.delete(`/reviews/${reviewId}`);
};
