import crypto from "crypto";
import mongoose from "mongoose";
import PendingAction from "../models/pendingAction.model.js";
import aiToolRegistry from "./aiAgent.service.js";
import inventoryReservationService from "../../inventory/inventoryReservation.service.js";
import { AppError } from "../../../common/exceptions/AppError.js";

const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((out, key) => {
        out[key] = canonicalize(value[key]);
        return out;
      }, {});
  }
  return value;
};

const digest = (value) =>
  crypto.createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

class PendingActionService {
  async create({ userId, conversationId, tool, params, summary }) {
    if (!userId) return null;

    // 1. Supersede unconfirmed pending actions in the same conversation
    // so the customer's latest request always takes precedence
    if (conversationId) {
      try {
        await PendingAction.updateMany(
          { userId, conversationId, status: "pending" },
          { $set: { status: "superseded" } }
        );
      } catch (err) {
        // Non-blocking superseding error
      }
    }

    // 2. Limit global active pending actions per user by automatically expiring the oldest
    try {
      const activeCount = await PendingAction.countDocuments({
        userId,
        status: "pending",
        expiresAt: { $gt: new Date() },
      });

      if (activeCount >= 5) {
        const oldestDocs = await PendingAction.find({
          userId,
          status: "pending",
          expiresAt: { $gt: new Date() },
        })
          .sort({ createdAt: 1 })
          .limit(activeCount - 4);

        if (oldestDocs.length > 0) {
          const idsToSupersede = oldestDocs.map((d) => d._id);
          await PendingAction.updateMany(
            { _id: { $in: idsToSupersede } },
            { $set: { status: "superseded" } }
          );
        }
      }
    } catch {
      // Non-blocking cleanup
    }

    const paramsHash = digest(params);
    const doc = await PendingAction.create({
      userId,
      conversationId: conversationId || null,
      tool,
      params,
      summary,
      paramsHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    return this.toClient(doc);
  }

  toClient(doc) {
    return {
      actionId: String(doc._id),
      actionType: doc.tool,
      summary: doc.summary,
      paramsHash: doc.paramsHash,
      expiresAt: doc.expiresAt,
      status: doc.status,
    };
  }

  async confirm({ actionId, paramsHash, userId, role }) {
    if (!mongoose.isValidObjectId(actionId)) {
      return { success: false, code: "INVALID_ACTION", message: "Thao tác không hợp lệ" };
    }
    const action = await PendingAction.findOne({ _id: actionId, userId });
    if (!action) {
      return {
        success: false,
        code: "NOT_FOUND",
        message: "Không tìm thấy thao tác hoặc bạn không có quyền",
      };
    }
    if (action.status !== "pending") {
      return {
        success: false,
        code: "ACTION_NOT_PENDING",
        message: "Thao tác này không còn chờ xác nhận",
        status: action.status,
      };
    }
    if (action.expiresAt <= new Date()) {
      action.status = "expired";
      await action.save();
      return { success: false, code: "ACTION_EXPIRED", message: "Thao tác đã hết hạn" };
    }

    const expected = Buffer.from(action.paramsHash);
    const supplied = Buffer.from(paramsHash || "");
    if (
      expected.length !== supplied.length ||
      !crypto.timingSafeEqual(expected, supplied)
    ) {
      return {
        success: false,
        code: "HASH_MISMATCH",
        message: "Dữ liệu thao tác đã thay đổi",
      };
    }

    // Claim atomically before mutation: a second click cannot execute it twice.
    const claimed = await PendingAction.findOneAndUpdate(
      { _id: action._id, status: "pending" },
      { $set: { status: "confirmed" } },
      { new: true }
    );
    if (!claimed) {
      return {
        success: false,
        code: "ACTION_ALREADY_USED",
        message: "Thao tác đã được xử lý",
      };
    }

    const result = await aiToolRegistry.executeTool(claimed.tool, claimed.params, {
      userId,
      role,
      confirmed: true,
      isConfirmedByGate: true,
    });
    claimed.status = result?.success ? "confirmed" : "failed";
    claimed.result = result;
    await claimed.save();
    return { ...result, action: this.toClient(claimed) };
  }

  async cancel({ actionId, userId }) {
    const action = await PendingAction.findOne({ _id: actionId, userId, status: "pending" });
    if (!action) {
      return { success: false, code: "NOT_FOUND", message: "Không tìm thấy thao tác đang chờ" };
    }
    action.status = action.expiresAt <= new Date() ? "expired" : "cancelled";
    await action.save();
    if (action.tool === "start_checkout" && action.params?.reservation_id) {
      await inventoryReservationService.releaseReservation(
        action.params.reservation_id,
        "USER_CANCELLED"
      );
    }
    return { success: true, status: action.status, action: this.toClient(action) };
  }
}

export default new PendingActionService();
