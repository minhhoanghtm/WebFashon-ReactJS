import axiosClient from "./axiosClient";

export const campaignApi = {
  // Public
  getActiveCampaigns: () => axiosClient.get("/campaigns/active"),
  getCampaignBySlug: (slug, params) =>
    axiosClient.get(`/campaigns/${slug}`, { params }),

  // Admin
  getAdminCampaigns: (params) =>
    axiosClient.get("/admin/campaigns", { params }),
  getAdminCampaignDetail: (id) => axiosClient.get(`/admin/campaigns/${id}`),
  createCampaign: (data) => axiosClient.post("/admin/campaigns", data),
  updateCampaign: (id, data) => axiosClient.put(`/admin/campaigns/${id}`, data),
  deleteCampaign: (id) => axiosClient.delete(`/admin/campaigns/${id}`),

  // Admin Campaign Products
  addCampaignProduct: (id, data) =>
    axiosClient.post(`/admin/campaigns/${id}/products`, data),
  updateCampaignProduct: (id, productId, data) =>
    axiosClient.put(`/admin/campaigns/${id}/products/${productId}`, data),
  removeCampaignProduct: (id, productId) =>
    axiosClient.delete(`/admin/campaigns/${id}/products/${productId}`),
};

export default campaignApi;

