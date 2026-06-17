import conversationService from "./conversation.service.js";
import { successResponse } from "../../common/responses/index.js";

const getUserId = (req) => req.user?.userId;

export const createConversation = async (req, res, next) => {
  try {
    const conversation = await conversationService.createConversation(getUserId(req), req.body);
    return successResponse(res, conversation, "Tao hoi thoai thanh cong", 201);
  } catch (error) {
    next(error);
  }
};

export const getMyConversations = async (req, res, next) => {
  try {
    const conversations = await conversationService.getMyConversations(getUserId(req), req.query);
    return successResponse(res, conversations, "Lay danh sach hoi thoai thanh cong");
  } catch (error) {
    next(error);
  }
};

export const getAdminConversations = async (req, res, next) => {
  try {
    const conversations = await conversationService.getAdminConversations(req.query);
    return successResponse(res, conversations, "Lay danh sach hoi thoai thanh cong");
  } catch (error) {
    next(error);
  }
};

export const getConversationDetail = async (req, res, next) => {
  try {
    const conversation = await conversationService.getConversationById(
      req.params.id,
      getUserId(req),
      req.isAdmin === true
    );
    return successResponse(res, conversation, "Lay chi tiet hoi thoai thanh cong");
  } catch (error) {
    next(error);
  }
};

export const updateConversation = async (req, res, next) => {
  try {
    const conversation = await conversationService.updateConversation(
      req.params.id,
      getUserId(req),
      req.body,
      req.isAdmin === true
    );
    return successResponse(res, conversation, "Cap nhat hoi thoai thanh cong");
  } catch (error) {
    next(error);
  }
};

export const closeConversation = async (req, res, next) => {
  try {
    const conversation = await conversationService.closeConversation(
      req.params.id,
      getUserId(req),
      req.isAdmin === true
    );
    return successResponse(res, conversation, "Dong hoi thoai thanh cong");
  } catch (error) {
    next(error);
  }
};
