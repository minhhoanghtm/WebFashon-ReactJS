import experimentService, { DEFAULT_REC_EXPERIMENT_ID } from "./experiment.service.js";
import experimentAnalyticsService from "./experimentAnalytics.service.js";
import Experiment from "./experiment.model.js";
import { successResponse } from "../../../common/responses/index.js";
import { AppError } from "../../../common/exceptions/AppError.js";

class ExperimentController {
  /**
   * GET /api/experiments - Lấy danh sách thử nghiệm (Admin)
   */
  async listExperiments(req, res, next) {
    try {
      const experiments = await Experiment.find().sort({ createdAt: -1 }).lean();
      return successResponse(res, experiments, "Lấy danh sách thử nghiệm thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/experiments - Tạo thử nghiệm mới (Admin)
   */
  async createExperiment(req, res, next) {
    try {
      const {
        experiment_id,
        name,
        description,
        variants,
        salt,
        target_metric,
        attribution_window_hours,
        traffic_allocation,
      } = req.body;

      if (!experiment_id || !name) {
        throw new AppError("Mã thử nghiệm (experiment_id) và tên thử nghiệm là bắt buộc", 400);
      }

      const normalizedId = experiment_id.trim();
      const existing = await Experiment.findOne({ experiment_id: normalizedId });
      if (existing) {
        throw new AppError(`Thử nghiệm với mã '${experiment_id}' đã tồn tại`, 409);
      }

      const experiment = await Experiment.create({
        experiment_id: normalizedId,
        name,
        description,
        variants,
        salt,
        target_metric,
        attribution_window_hours,
        traffic_allocation,
        created_by: req.user?.userId || req.user?.id || null,
      });

      return successResponse(res, experiment, "Tạo thử nghiệm thành công", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/experiments/:id - Lấy chi tiết thử nghiệm (Admin)
   */
  async getExperiment(req, res, next) {
    try {
      const { id } = req.params;
      const experiment = await Experiment.findOne({ experiment_id: id }).lean();
      if (!experiment) {
        throw new AppError(`Không tìm thấy thử nghiệm '${id}'`, 404);
      }
      return successResponse(res, experiment, "Lấy chi tiết thử nghiệm thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/experiments/:id - Cập nhật cấu hình thử nghiệm (Admin)
   */
  async updateExperiment(req, res, next) {
    try {
      const { id } = req.params;
      const exp = await Experiment.findOne({ experiment_id: id });
      if (!exp) {
        throw new AppError(`Không tìm thấy thử nghiệm '${id}'`, 404);
      }

      const allowedFields = [
        "name",
        "description",
        "status",
        "variants",
        "attribution_window_hours",
        "traffic_allocation",
        "end_date",
      ];

      const oldSnapshot = exp.toObject();
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          exp[field] = req.body[field];
        }
      });

      exp.config_history.push({
        changed_at: new Date(),
        changed_by: req.user?.userId ? req.user.userId.toString() : "admin",
        changes: { previous: oldSnapshot, updated: req.body },
      });

      await exp.save();
      await experimentService.invalidateExperimentCache(id);

      return successResponse(res, exp, "Cập nhật cấu hình thử nghiệm thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/experiments/:id/toggle - Bật/tắt hoặc rollback khẩn cấp (Admin)
   */
  async toggleExperiment(req, res, next) {
    try {
      const { id } = req.params;
      const { status, rollbackToControl = false } = req.body;

      const adminId = req.user?.userId || req.user?.id || null;
      const updatedExp = await experimentService.updateExperimentStatus(id, {
        status,
        rollbackToControl,
        adminId,
      });

      return successResponse(
        res,
        updatedExp,
        rollbackToControl
          ? "Đã thực hiện Rollback khẩn cấp toàn bộ lưu lượng về nhóm Đối chứng Control A"
          : `Đã chuyển trạng thái thử nghiệm sang: ${updatedExp.status}`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/experiments/:id/analytics - Lấy báo cáo phân tích A/B Testing & SRM (Admin)
   */
  async getAnalytics(req, res, next) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const analytics = await experimentAnalyticsService.getExperimentAnalytics(id, {
        startDate,
        endDate,
      });

      return successResponse(res, analytics, "Lấy báo cáo phân tích thử nghiệm thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/experiments/exposed - Ghi nhận tiếp xúc thực tế khi recommendation vào viewport (Storefront)
   */
  async recordExposure(req, res, next) {
    try {
      const userId = req.user?.userId || req.user?.id || null;
      const anonymousId = req.body.anonymous_id || req.headers["x-anonymous-id"] || null;
      const experimentId = req.body.experiment_id || DEFAULT_REC_EXPERIMENT_ID;
      let variant = req.body.variant;
      const requestId = req.body.request_id || null;
      const meta = req.body.meta || {};

      const effectiveSubject = userId || anonymousId;
      if (!effectiveSubject) {
        throw new AppError("Yêu cầu định danh người dùng (userId hoặc anonymousId) để ghi nhận tiếp xúc", 400);
      }

      // BẢO MẬT & TOÀN VẸN: Kiểm chứng nhóm được gán từ Server để chống giả mạo Variant từ Client
      const expectedAssignment = await experimentService.assignVariant(effectiveSubject, {
        userId,
        anonymousId,
        experimentId,
      });

      if (!expectedAssignment?.isAssigned) {
        return successResponse(
          res,
          { recorded: false, reason: expectedAssignment?.reason || "not_assigned" },
          "Bỏ qua do đối tượng không tham gia thử nghiệm"
        );
      }

      // Nếu client gửi variant lệch với phân nhóm của server -> ép về variant chuẩn
      if (variant && variant !== expectedAssignment.variant) {
        variant = expectedAssignment.variant;
      }
      variant = variant || expectedAssignment.variant;

      const recorded = await experimentService.recordExposure({
        subjectId: effectiveSubject,
        userId,
        anonymousId,
        experimentId,
        variant,
        requestId,
        meta,
      });

      return successResponse(
        res,
        { recorded, variant },
        recorded ? "Ghi nhận tiếp xúc thành công" : "Bỏ qua ghi nhận do đã tiếp xúc trong phiên"
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new ExperimentController();
