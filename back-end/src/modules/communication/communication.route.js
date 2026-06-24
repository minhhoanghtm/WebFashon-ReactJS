import express from "express";
import { adminOnly, protectedRoute, optionalProtectedRoute, noAdmin } from "../../middlewares/auth.middleware.js";
import {
  assignConversation,
  closeConversation,
  getAdminConversations,
  getCustomerConversations,
  getMyAssignedConversations,
  getUnassignedConversations,
  reopenConversation,
  transferConversation,
} from "./conversations/conversation.controller.js";
import { getAdminMessages, getCustomerMessages } from "./messages/message.controller.js";
import { sendAiMessage } from "./aiChat/aiChat.controller.js";
import {
  sendAdminSupportMessage,
  sendCustomerSupportMessage,
} from "./supportChat/supportChat.controller.js";

export const adminCommunicationRouter = express.Router();
adminCommunicationRouter.use(protectedRoute, adminOnly);
adminCommunicationRouter.get("/conversations", getAdminConversations);
adminCommunicationRouter.get("/conversations/unassigned", getUnassignedConversations);
adminCommunicationRouter.get("/conversations/my", getMyAssignedConversations);
adminCommunicationRouter.post("/conversations/:id/assign", assignConversation);
adminCommunicationRouter.post("/conversations/:id/transfer", transferConversation);
adminCommunicationRouter.post("/conversations/:id/close", closeConversation);
adminCommunicationRouter.post("/conversations/:id/reopen", reopenConversation);
adminCommunicationRouter.get("/messages/:conversationId", getAdminMessages);
adminCommunicationRouter.post("/support/send", sendAdminSupportMessage);

export const customerCommunicationRouter = express.Router();
customerCommunicationRouter.post("/ai/send", optionalProtectedRoute, noAdmin, sendAiMessage);
customerCommunicationRouter.use(protectedRoute, noAdmin);
customerCommunicationRouter.post("/support/send", sendCustomerSupportMessage);
customerCommunicationRouter.get("/conversations", getCustomerConversations);
customerCommunicationRouter.get("/messages/:conversationId", getCustomerMessages);
