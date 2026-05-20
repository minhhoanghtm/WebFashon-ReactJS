import {
  createReviewApi,
  deleteReviewApi,
  getReviewsByProductIdApi,
  updateReviewApi,
} from "@/api/reviewApi";

export const getReviewsByProductIdService = async (productId) => {
  const res = await getReviewsByProductIdApi(productId);
  return res.data?.data ?? res.data;
};

export const createReviewService = async (data) => {
  const res = await createReviewApi(data);
  return res.data;
};

export const updateReviewService = async (reviewId, data) => {
  const res = await updateReviewApi(reviewId, data);
  return res.data?.data ?? res.data;
};

export const deleteReviewService = async (reviewId) => {
  const res = await deleteReviewApi(reviewId);
  return res.data;
};
