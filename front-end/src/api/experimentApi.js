import axiosClient from "./axiosClient";

const experimentApi = {
  // Storefront: Ghi nhận tiếp xúc thực tế khi recommendation vào viewport
  recordExposure: (payload) => {
    return axiosClient.post("/experiments/exposed", payload);
  },

  // Admin APIs
  listExperiments: () => {
    return axiosClient.get("/experiments");
  },

  getExperiment: (id) => {
    return axiosClient.get(`/experiments/${id}`);
  },

  createExperiment: (data) => {
    return axiosClient.post("/experiments", data);
  },

  updateExperiment: (id, data) => {
    return axiosClient.put(`/experiments/${id}`, data);
  },

  toggleExperiment: (id, payload) => {
    return axiosClient.post(`/experiments/${id}/toggle`, payload);
  },

  getAnalytics: (id, params = {}) => {
    return axiosClient.get(`/experiments/${id}/analytics`, { params });
  },
};

export default experimentApi;
