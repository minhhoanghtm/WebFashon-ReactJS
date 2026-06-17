import { chatApi } from "@/api/chat.api";

const unwrap = (response) => response?.data ?? response;

export const getAdminConversationsService = async (params) => {
  return unwrap(await chatApi.getAdminConversations(params));
};

export const getAdminConversationDetailService = async (id) => {
  return unwrap(await chatApi.getAdminConversationDetail(id));
};

export const closeAdminConversationService = async (id) => {
  return unwrap(await chatApi.closeAdminConversation(id));
};

export const getAdminMessagesService = async (conversationId, params) => {
  return unwrap(await chatApi.getAdminMessages(conversationId, params));
};

export const sendAdminMessageService = async (data) => {
  return unwrap(await chatApi.sendAdminMessage(data));
};
