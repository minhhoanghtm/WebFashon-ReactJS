import { successResponse } from "../../common/responses/index.js";
import pendingActionService from "./services/pendingAction.service.js";

export const confirmPendingAction = async (req, res, next) => {
  try { return successResponse(res, await pendingActionService.confirm({ actionId: req.params.id, paramsHash: req.body?.paramsHash, userId: req.user.userId, role: req.user.role }), "Đã xử lý thao tác AI", 200); } catch (error) { next(error); }
};
export const cancelPendingAction = async (req, res, next) => {
  try { return successResponse(res, await pendingActionService.cancel({ actionId: req.params.id, userId: req.user.userId }), "Đã hủy thao tác AI", 200); } catch (error) { next(error); }
};
