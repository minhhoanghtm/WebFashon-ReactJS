import axiosClient from "./axiosClient";

export const chatApi = {
  getAdminConversations: (params) => axiosClient.get("/admin/conversations", { params }),
  getAdminConversationDetail: (id) => axiosClient.get("/admin/conversations", { params: { id } }),
  assignAdminConversation: (id) => axiosClient.post(`/admin/conversations/${id}/assign`),
  closeAdminConversation: (id) => axiosClient.post(`/admin/conversations/${id}/close`),
  reopenAdminConversation: (id) => axiosClient.post(`/admin/conversations/${id}/reopen`),
  getAdminMessages: (conversationId, params) =>
    axiosClient.get(`/admin/messages/${conversationId}`, { params }),
  sendAdminMessage: (data) => axiosClient.post("/admin/support/send", data),

  // Customer endpoints
  getCustomerConversations: () => axiosClient.get("/chat/conversations"),
  getCustomerMessages: (conversationId, params) => axiosClient.get(`/chat/messages/${conversationId}`, { params }),
  sendCustomerAiMessage: (payload) => axiosClient.post("/chat/ai/send", payload),
  confirmAiAction: (id, paramsHash) => axiosClient.post(`/chat/ai/actions/${id}/confirm`, { paramsHash }),
  cancelAiAction: (id) => axiosClient.post(`/chat/ai/actions/${id}/cancel`),
  sendCustomerSupportMessage: (payload) => axiosClient.post("/chat/support/send", payload),
};
