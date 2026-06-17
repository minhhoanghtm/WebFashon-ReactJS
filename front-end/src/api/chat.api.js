import axiosClient from "./axiosClient";

export const chatApi = {
  getAdminConversations: (params) => axiosClient.get("/conversations/admin", { params }),
  getAdminConversationDetail: (id) => axiosClient.get(`/conversations/admin/${id}`),
  closeAdminConversation: (id) => axiosClient.patch(`/conversations/admin/${id}/close`),
  getAdminMessages: (conversationId, params) =>
    axiosClient.get(`/messages/admin/conversation/${conversationId}`, { params }),
  sendAdminMessage: (data) => axiosClient.post("/messages/admin", data),
};
