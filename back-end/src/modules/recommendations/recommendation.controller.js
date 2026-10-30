import recommendationService from "./recommendation.service.js";
import { successResponse } from "../../common/responses/index.js";

class RecommendationController {
  async getRecommendations(req, res, next) {
    try {
      const userId = req.user?.userId || req.user?.id || null;
      const anonymousId = req.query.anonymous_id || req.headers["x-anonymous-id"] || null;
      const limit = req.query.limit || 12;

      const result = await recommendationService.getRecommendations({
        userId,
        anonymousId,
        limit,
      });

      return successResponse(res, result, "Lấy danh sách đề xuất sản phẩm thành công");
    } catch (error) {
      console.error("[RecommendationController] Fallback do lỗi:", error?.message);
      return successResponse(
        res,
        { mode: "empty", products: [] },
        "Lấy danh sách đề xuất sản phẩm thành công (fallback)"
      );
    }
  }
}

export default new RecommendationController();
