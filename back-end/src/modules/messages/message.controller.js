import messageService from "./message.service.js";
import { successResponse } from "../../common/responses/index.js";

const getUserId = (req) => req.user?.userId;

export const getMessages = async (req, res, next) => {
  try {
    const conversationId = req.params.conversationId || req.query.conversation;
    const messages = await messageService.getMessages(
      conversationId,
      getUserId(req),
      req.query,
      req.isAdmin === true
    );
    return successResponse(res, messages, "Lay danh sach tin nhan thanh cong");
  } catch (error) {
    next(error);
  }
};

export const createMessage = async (req, res, next) => {
  try {
    const message = await messageService.createMessage(
      getUserId(req),
      req.body,
      req.isAdmin === true
    );
    return successResponse(res, message, "Gui tin nhan thanh cong", 201);
  } catch (error) {
    next(error);
  }
};
