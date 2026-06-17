import axiosClient from './axiosClient';

export const pageApi = {
  // Public Pages API
  getAllPages: (params) => axiosClient.get('/pages', { params }),
  getPageBySlug: (slug) => axiosClient.get(`/pages/${slug}`),
  incrementPageView: (slug) => axiosClient.patch(`/pages/${slug}/view`),

  // Public Lookbooks API
  getLookbooks: (params) => axiosClient.get('/lookbooks', { params }),
  getFeaturedLookbook: () => axiosClient.get('/lookbooks/featured'),
  getLookbookBySlug: (slug) => axiosClient.get(`/lookbooks/${slug}`),

  // Admin Pages API
  adminGetPages: (params) => axiosClient.get('/admin/pages', { params }),
  adminGetPageById: (id) => axiosClient.get(`/admin/pages/${id}`),
  adminGetPageDetail: (id) => axiosClient.get(`/admin/pages/${id}/detail`),
  adminCreatePage: (data) => axiosClient.post('/admin/pages', data),
  adminUpdatePage: (id, data) => axiosClient.put(`/admin/pages/${id}`, data),
  adminDeletePage: (id) => axiosClient.delete(`/admin/pages/${id}`),
  adminToggleFeaturePage: (id) => axiosClient.put(`/admin/pages/${id}/feature`),

  // Admin PageSections API
  adminGetPageSections: (pageId) => axiosClient.get(`/admin/page-sections/${pageId}`),
  adminReplacePageSections: (pageId, data) => axiosClient.post(`/admin/page-sections/${pageId}/replace`, data),
  adminReorderPageSections: (pageId, data) => axiosClient.put(`/admin/page-sections/${pageId}/reorder`, data),
};

export default pageApi;
