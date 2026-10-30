import mongoose from "mongoose";
import { successResponse } from "../../common/responses/index.js";
import embeddingService from "./services/embedding.service.js";
import vectorIndexService from "./services/vectorIndex.service.js";
import semanticSearchService from "./services/semanticSearch.service.js";
import ragService from "./services/rag.service.js";
import aiToolRegistry from "./services/aiAgent.service.js";
import aiChatService from "../communication/aiChat/aiChat.service.js";
import { enqueueVectorSyncJob } from "./queues/vectorSync.queue.js";

export const semanticSearchController = async (req, res, next) => {
  try {
    const params = req.validatedAiData || { ...req.query, ...req.body };
    const authContext = {
      userId: req.user?.userId || null,
      role: req.user?.role || "guest",
    };

    const data = await semanticSearchService.search(params, authContext);
    return successResponse(res, data, "Tìm kiếm ngữ nghĩa thành công", 200);
  } catch (error) {
    next(error);
  }
};

export const aiChatController = async (req, res, next) => {
  try {
    const payload = req.validatedAiData || req.body;
    const userId = req.user?.userId || null;
    const role = req.user?.role || "user";

    if (payload.mode === "rag") {
      const ragData = await ragService.answerQuestion(
        payload.content,
        { history: payload.history },
        { userId, role }
      );
      return successResponse(res, ragData, "Trả lời RAG thành công", 200);
    }

    const chatData = await aiChatService.sendMessage(userId, payload, { role });
    return successResponse(res, chatData, "AI chat message processed successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const syncEmbeddingsController = async (req, res, next) => {
  try {
    const params = req.validatedAiData || req.body || {};

    // Single entity sync if sourceType + sourceId provided
    if (params.sourceType && params.sourceId) {
      if (params.sourceType === "product") {
        const result = await vectorIndexService.syncProductById(params.sourceId, {
          force: params.force,
        });
        return successResponse(res, result, "Đồng bộ vector sản phẩm thành công", 200);
      }
      if (params.sourceType === "page") {
        const result = await vectorIndexService.syncPageById(params.sourceId, {
          force: params.force,
        });
        return successResponse(res, result, "Đồng bộ vector trang nội dung thành công", 200);
      }
    }

    // Background sync via BullMQ / async worker
    if (params.background) {
      const queued = await enqueueVectorSyncJob({
        action: "sync_all",
        options: {
          types: params.types,
          force: params.force,
          batchSize: params.batchSize,
        },
      });
      return successResponse(
        res,
        { queued, syncState: vectorIndexService.syncState },
        "Đã đưa tiến trình đồng bộ Vector vào chạy nền",
        202
      );
    }

    const summary = await vectorIndexService.syncAll({
      types: params.types,
      force: params.force,
      batchSize: params.batchSize,
    });

    return successResponse(res, summary, "Đồng bộ dữ liệu Vector hoàn tất", 200);
  } catch (error) {
    next(error);
  }
};

export const getAiHealthController = async (_req, res, next) => {
  try {
    const mongoReady = mongoose.connection.readyState === 1;
    let indexStats = null;
    if (mongoReady) {
      indexStats = await vectorIndexService.getIndexStats().catch(() => null);
    }

    const embeddingMetrics = embeddingService.getMetrics();
    const searchMetrics = semanticSearchService.getMetrics();
    const ragMetrics = ragService.getMetrics();
    const agentMetrics = aiToolRegistry.getMetrics();
    const chatMetrics = aiChatService.getMetrics();

    return successResponse(
      res,
      {
        status: "OK",
        vectorSearchEngine: process.env.VECTOR_SEARCH_ENGINE || "mongo_cosine",
        databaseConnected: mongoReady,
        indexStats,
        metrics: {
          embedding: embeddingMetrics,
          semanticSearch: searchMetrics,
          rag: ragMetrics,
          agentTools: agentMetrics,
          chat: chatMetrics,
        },
        timestamp: new Date(),
      },
      "AI Vector service is healthy",
      200
    );
  } catch (error) {
    next(error);
  }
};
