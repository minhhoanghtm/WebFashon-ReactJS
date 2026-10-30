import axiosClient from "./axiosClient";

export const recommendationApi = {
  getRecommendations: (limit = 12) =>
    axiosClient.get("/recommendations", { params: { limit } }),
};

export default recommendationApi;
