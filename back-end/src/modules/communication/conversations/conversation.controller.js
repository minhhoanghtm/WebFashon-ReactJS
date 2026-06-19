import conversationService from "./conversation.service.js";
import { successResponse } from "../../../common/responses/index.js";

const actorFromRequest = (req, role = req.user?.role) => ({
  userId: req.user?.userId,
  role,
});

export const getCustomerConversations = async (req, res, next) => {
  try {
    const data = await conversationService.listCustomerConversations(req.user.userId, req.query);
    return successResponse(res, data, "Customer conversations fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getAdminConversations = async (req, res, next) => {
  try {
    const data = await conversationService.listAdminConversations(req.query, req.user.userId);
    return successResponse(res, data, "Admin conversations fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getUnassignedConversations = async (req, res, next) => {
  try {
    const data = await conversationService.listAdminConversations(
      { ...req.query, assigned: "unassigned", status: req.query.status || "waiting_admin" },
      req.user.userId
    );
    return successResponse(res, data, "Unassigned conversations fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getMyAssignedConversations = async (req, res, next) => {
  try {
    const data = await conversationService.listAdminConversations(
      { ...req.query, assigned: "my" },
      req.user.userId
    );
    return successResponse(res, data, "Assigned conversations fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const assignConversation = async (req, res, next) => {
  try {
    const adminId = req.body.adminId || req.user.userId;
    const data = await conversationService.assignConversation(req.params.id, adminId);
    return successResponse(res, data, "Conversation assigned successfully");
  } catch (error) {
    next(error);
  }
};

export const transferConversation = async (req, res, next) => {
  try {
    const data = await conversationService.transferConversation(req.params.id, req.body.adminId);
    return successResponse(res, data, "Conversation transferred successfully");
  } catch (error) {
    next(error);
  }
};

export const closeConversation = async (req, res, next) => {
  try {
    const data = await conversationService.closeConversation(req.params.id, actorFromRequest(req, "admin"));
    return successResponse(res, data, "Conversation closed successfully");
  } catch (error) {
    next(error);
  }
};

export const reopenConversation = async (req, res, next) => {
  try {
    const data = await conversationService.reopenConversation(req.params.id, actorFromRequest(req, "admin"));
    return successResponse(res, data, "Conversation reopened successfully");
  } catch (error) {
    next(error);
  }
};
