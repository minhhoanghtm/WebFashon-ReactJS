import aiChatService from "./aiChat.service.js";
import { successResponse } from "../../../common/responses/index.js";
import pendingActionService from "../../ai/services/pendingAction.service.js";
import logger from "../../../common/logger.js";

export const sendAiMessage = async (req, res, next) => {
  try {
    const data = await aiChatService.sendMessage(req.user?.userId, req.body, {
      role: req.user?.role || "user",
    });

    if (
      (data.pendingAction?.actionType === "add_to_cart" ||
        data.pendingAction?.actionType === "start_checkout" ||
        data.pendingAction?.actionType === "buy_now") &&
      req.user?.userId
    ) {
      try {
        const toolType =
          data.pendingAction.actionType === "add_to_cart" ? "add_to_cart" : "start_checkout";
        const items = (data.pendingAction.items || []).map((item) => ({
          product_id: String(item.product_id || item.productId),
          variant_id: item.variant_id || item.variantId || null,
          color: item.color,
          size: item.size,
          quantity: Number(item.quantity || 1),
        }));
        const action = await pendingActionService.create({
          userId: req.user.userId,
          conversationId: data.conversationId,
          tool: toolType,
          params: {
            items,
            reservation_id: data.pendingAction.reservationId || null,
            confirmed: false,
          },
          summary: {
            actionType: toolType,
            reservationId: data.pendingAction.reservationId || null,
            items: data.pendingAction.items || [],
            totalEstimatedPrice: data.pendingAction.totalEstimatedPrice,
            totalEstimatedPriceFormatted: data.pendingAction.totalEstimatedPriceFormatted,
            checkoutUrl: data.pendingAction.checkoutUrl || null,
            expiresAt: data.pendingAction.expiresAt || null,
            remainingSeconds: data.pendingAction.remainingSeconds || 300,
          },
        });
        if (action) {
          data.pendingAction = { ...data.pendingAction, ...action };
          if (data.aiMessage) {
            data.aiMessage.metadata = {
              ...(data.aiMessage.metadata || {}),
              pendingAction: data.pendingAction,
            };
          }
        }
      } catch (pendingErr) {
        logger.warn("Pending action creation non-fatal error in sendAiMessage:", pendingErr.message);
      }
    }

    if (res.headersSent || res.writableEnded) {
      return;
    }
    return successResponse(res, data, "AI chat message sent successfully", 201);
  } catch (error) {
    if (res.headersSent || res.writableEnded) {
      return;
    }
    next(error);
  }
};
