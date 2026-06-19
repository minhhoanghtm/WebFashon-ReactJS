import { chatApi } from "@/api/chat.api";

const unwrap = (response) => response?.data ?? response;

export const getAdminConversationsService = async (params) => {
  return unwrap(await chatApi.getAdminConversations(params));
};

export const getAdminConversationDetailService = async (id) => {
  return unwrap(await chatApi.getAdminConversationDetail(id));
};

export const assignAdminConversationService = async (id) => {
  return unwrap(await chatApi.assignAdminConversation(id));
};

export const closeAdminConversationService = async (id) => {
  return unwrap(await chatApi.closeAdminConversation(id));
};

export const reopenAdminConversationService = async (id) => {
  return unwrap(await chatApi.reopenAdminConversation(id));
};

export const getAdminMessagesService = async (conversationId, params) => {
  return unwrap(await chatApi.getAdminMessages(conversationId, params));
};

export const sendAdminMessageService = async (data) => {
  return unwrap(await chatApi.sendAdminMessage(data));
};

export const getCustomerConversationsService = async () => {
  return unwrap(await chatApi.getCustomerConversations());
};

export const getCustomerMessagesService = async (conversationId) => {
  return unwrap(await chatApi.getCustomerMessages(conversationId));
};

export const sendCustomerAiMessageService = async (payload) => {
  return unwrap(await chatApi.sendCustomerAiMessage(payload));
};

export const sendCustomerSupportMessageService = async (payload) => {
  return unwrap(await chatApi.sendCustomerSupportMessage(payload));
};
