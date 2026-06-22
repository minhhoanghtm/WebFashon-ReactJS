import aiChatService from "./aiChat.service.js";
import { successResponse } from "../../../common/responses/index.js";

export const sendAiMessage = async (req, res, next) => {
  try {
    // console.log("BODY:", req.body);
    const data = await aiChatService.sendMessage(req.user?.userId, req.body);
    return successResponse(res, data, "AI chat message sent successfully", 201);
  } catch (error) {
    next(error);
  }
};
