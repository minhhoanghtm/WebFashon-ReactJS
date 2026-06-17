import pageApi from "../api/pageApi";

export const getAllPagesService = async (params) => {
  const res = await pageApi.getAllPages(params);
  return res.data?.data ?? res.data ?? { pages: [], total: 0 };
};

export const getPageBySlugService = async (slug) => {
  const res = await pageApi.getPageBySlug(slug);
  return res.data?.data ?? res.data;
};

export const incrementPageViewService = async (slug) => {
  try {
    const res = await pageApi.incrementPageView(slug);
    return res.data?.data ?? res.data;
  } catch (error) {
    console.error("Lỗi khi tăng lượt xem trang:", error);
  }
};

export const getLookbooksService = async (params) => {
  const res = await pageApi.getLookbooks(params);
  return res.data?.data ?? res.data ?? { pages: [], total: 0 };
};

export const getFeaturedLookbookService = async () => {
  const res = await pageApi.getFeaturedLookbook();
  return res.data?.data ?? res.data;
};

export const getLookbookBySlugService = async (slug) => {
  const res = await pageApi.getLookbookBySlug(slug);
  return res.data?.data ?? res.data;
};

export const adminGetPagesService = async (params) => {
  const res = await pageApi.adminGetPages(params);
  return res.data?.data ?? res.data ?? { pages: [], total: 0 };
};

export const adminGetPageByIdService = async (id) => {
  const res = await pageApi.adminGetPageById(id);
  return res.data?.data ?? res.data;
};

export const adminCreatePageService = async (data) => {
  const res = await pageApi.adminCreatePage(data);
  return res.data?.data ?? res.data;
};

export const adminUpdatePageService = async (id, data) => {
  const res = await pageApi.adminUpdatePage(id, data);
  return res.data?.data ?? res.data;
};

export const adminDeletePageService = async (id) => {
  const res = await pageApi.adminDeletePage(id);
  return res.data?.data ?? res.data;
};

export const adminGetPageSectionsService = async (pageId) => {
  const res = await pageApi.adminGetPageSections(pageId);
  return res.data?.data ?? res.data ?? [];
};

export const adminReplacePageSectionsService = async (pageId, sections) => {
  const res = await pageApi.adminReplacePageSections(pageId, { sections });
  return res.data?.data ?? res.data ?? [];
};

export const adminReorderPageSectionsService = async (pageId, orders) => {
  const res = await pageApi.adminReorderPageSections(pageId, { orders });
  return res.data?.data ?? res.data ?? [];
};

export const adminGetPageDetailService = async (id) => {
  const res = await pageApi.adminGetPageDetail(id);
  return res.data?.data ?? res.data;
};

export const adminToggleFeaturePageService = async (id) => {
  const res = await pageApi.adminToggleFeaturePage(id);
  return res.data?.data ?? res.data;
};

