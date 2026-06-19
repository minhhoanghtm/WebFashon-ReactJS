import messageService from "./message.service.js";
import { successResponse } from "../../../common/responses/index.js";

const actorFromRequest = (req, role = req.user?.role) => ({
  userId: req.user?.userId,
  role,
});

export const getCustomerMessages = async (req, res, next) => {
  try {
    const data = await messageService.listMessages(req.params.conversationId, actorFromRequest(req, "user"), req.query);
    return successResponse(res, data, "Messages fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getAdminMessages = async (req, res, next) => {
  try {
    const data = await messageService.listMessages(req.params.conversationId, actorFromRequest(req, "admin"), req.query);
    return successResponse(res, data, "Messages fetched successfully");
  } catch (error) {
    next(error);
  }
};
