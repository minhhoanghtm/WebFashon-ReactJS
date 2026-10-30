import mongoose from "mongoose";
import productFacade from "../../products/product.facade.js";
import conversationService from "../conversations/conversation.service.js";
import messageService from "../messages/message.service.js";
import assignmentService from "../supportChat/assignment/assignment.service.js";
import aiChatRepository from "./aiChat.repository.js";
import { createAIProvider } from "./providers/createAIProvider.js";
import { buildSystemPrompt } from "./prompts/systemPrompt.js";
import { validateTextMessageDto } from "../validators/communication.validator.js";
import { shopTools } from "./tools/shopTools.js";
import { executeTool } from "./tools/toolExecutor.js";
import ragService from "../../ai/services/rag.service.js";
import aiToolRegistry from "../../ai/services/aiAgent.service.js";
import { parseNaturalLanguageQuery } from "../../ai/services/semanticSearch.service.js";
import UserInterestProfile from "../../recommendations/userInterestProfile.model.js";
import recommendationService from "../../recommendations/recommendation.service.js";
import { addTrackingJob } from "../../../queues/tracking.queue.js";
import logger from "../../../common/logger.js";

const handoffPatterns = [
  /khi[eê]u n[aạ]i/i,
  /ho[aà]n ti[eề]n/i,
  /tr[aả] h[aà]ng/i,
  /g[aặ]p nh[aâ]n vi[eê]n/i,
  /nh[aâ]n vi[eê]n h[oỗ] tr[oợ]/i,
  /h[oỗ] tr[oợ] ng[uư][oờ]i/i,
  /chat v[oớ]i admin/i,
];

class AiChatService {
  constructor() {
    this.metrics = {
      totalMessages: 0,
      totalTokensUsed: 0,
      handoffCount: 0,
      lastLatencyMs: 0,
      avgLatencyMs: 0,
    };
  }

  get provider() {
    if (!this._provider) {
      this._provider = createAIProvider();
    }
    return this._provider;
  }

  setProvider(customProvider) {
    this._provider = customProvider;
  }

  needsHandoff(content) {
    const lower = String(content || "").toLowerCase();
    // Do not handoff if user is simply asking about return policy ("chính sách đổi trả/hoàn tiền")
    if (/(?:chính sách|chinh sach|quy định|quy dinh|hỏi về|cho hỏi)/i.test(lower)) {
      return false;
    }
    return handoffPatterns.some((pattern) => pattern.test(content));
  }

  async buildProductContext(productId) {
    if (!productId) return null;
    try {
      return await productFacade.getProductDetail(productId);
    } catch {
      return null;
    }
  }

  _recordLatency(ms, tokens = 0) {
    this.metrics.totalMessages += 1;
    this.metrics.totalTokensUsed += Number(tokens || 0);
    this.metrics.lastLatencyMs = ms;
    const n = this.metrics.totalMessages;
    this.metrics.avgLatencyMs = Number(
      (((this.metrics.avgLatencyMs * (n - 1)) + ms) / n).toFixed(2)
    );
  }

  async _persistTurn({ userId, conversation, userContent, aiContent, userMetadata, aiMetadata }) {
    let userMessage = {
      senderType: "user",
      content: userContent,
      createdAt: new Date(),
    };
    if (userId && conversation) {
      userMessage = await messageService.createMessage(
        {
          conversationId: conversation._id,
          senderType: "user",
          senderId: userId,
          messageType: "text",
          content: userContent,
          metadata: userMetadata || {},
        },
        { userId, role: "user" }
      );
    }

    let aiMessage = {
      senderType: "ai",
      content: aiContent,
      metadata: aiMetadata || {},
      createdAt: new Date(),
    };
    if (userId && conversation) {
      aiMessage = await messageService.createMessage(
        {
          conversationId: conversation._id,
          senderType: "ai",
          senderId: null,
          messageType: "text",
          content: aiContent,
          metadata: aiMetadata || {},
        },
        { userId, role: "user" }
      );
    }

    return { userMessage, aiMessage };
  }

  async sendMessage(userId, payload, authOptions = {}) {
    const startTime = Date.now();
    const data = validateTextMessageDto(payload);
    const userRole = authOptions?.role || "user";

    // 1. Get or create conversation if authenticated
    let conversation = null;
    if (userId && userRole !== "admin") {
      conversation = data.conversationId
        ? await conversationService.getConversationById(data.conversationId, {
            userId,
            role: "user",
          })
        : await conversationService.getOrCreateCustomerAiConversation(userId, {
            currentProductId: data.currentProductId,
          });
    }

    // 2. Initialize metadata / context
    let lastProductId = data.currentProductId || data.metadata?.lastProductId || null;
    let lastIntent = data.metadata?.lastIntent || null;
    let pendingAction = data.metadata?.pendingAction || null;

    if (userId && conversation) {
      if (!conversation.metadata) {
        conversation.metadata = {};
      }
      if (data.currentProductId && conversation.metadata.lastProductId !== data.currentProductId) {
        conversation.metadata.lastProductId = data.currentProductId;
        conversation.markModified("metadata");
        await conversation.save();
      }
      if (conversation.metadata.lastProductId) {
        lastProductId = conversation.metadata.lastProductId;
      }
      if (conversation.metadata.lastIntent) {
        lastIntent = conversation.metadata.lastIntent;
      }
      if (conversation.metadata.pendingAction && !pendingAction) {
        pendingAction = conversation.metadata.pendingAction;
      }
    }

    const cleanContent = data.content.trim().toLowerCase().normalize("NFC");

    // 3. Handle explicit Action Cancellation or Confirmation (Confirmation Gate)
    if (data.cancelAction || (pendingAction && aiToolRegistry.detectCancelReply(cleanContent))) {
      pendingAction = null;
      if (userId && conversation) {
        conversation.metadata = { ...conversation.metadata, pendingAction: null };
        conversation.markModified("metadata");
        await conversation.save();
      }

      const aiResponseText = "Đã hủy thao tác thêm sản phẩm vào giỏ hàng theo yêu cầu của bạn. Bạn cần mình tìm sản phẩm nào khác không ạ?";
      const { userMessage, aiMessage } = await this._persistTurn({
        userId,
        conversation,
        userContent: data.content,
        aiContent: aiResponseText,
        userMetadata: data.metadata,
        aiMetadata: { actionResult: { status: "CANCELLED" } },
      });

      this._recordLatency(Date.now() - startTime, 0);
      return {
        conversationId: userId && conversation ? conversation._id : null,
        userMessage,
        aiMessage,
        sources: [],
        pendingAction: null,
        actionResult: { status: "CANCELLED", message: aiResponseText },
        metadata: { lastIntent, lastProductId, pendingAction: null },
      };
    }

    const actionToConfirm =
      data.confirmAction ||
      (pendingAction && aiToolRegistry.detectConfirmationReply(cleanContent)
        ? pendingAction
        : null);

    if (actionToConfirm && actionToConfirm.actionType === "add_to_cart") {
      // 1. Enforce Customer Authentication & Role
      if (!userId) {
        const errorText =
          "⚠️ Bạn cần đăng nhập tài khoản khách hàng để thực hiện xác nhận thêm sản phẩm vào giỏ hàng.";
        const { userMessage, aiMessage } = await this._persistTurn({
          userId,
          conversation,
          userContent: data.content,
          aiContent: errorText,
          userMetadata: data.metadata,
          aiMetadata: {
            actionResult: {
              success: false,
              code: "AUTH_REQUIRED",
              message: errorText,
            },
          },
        });
        this._recordLatency(Date.now() - startTime, 0);
        return {
          conversationId: null,
          userMessage,
          aiMessage,
          sources: [],
          pendingAction: null,
          actionResult: {
            success: false,
            code: "AUTH_REQUIRED",
            message: errorText,
          },
          metadata: { lastIntent, lastProductId, pendingAction: null },
        };
      }

      if (userRole === "admin") {
        const errorText =
          "⚠️ Quản trị viên không được phép thực hiện thao tác giỏ hàng khách hàng.";
        const { userMessage, aiMessage } = await this._persistTurn({
          userId,
          conversation,
          userContent: data.content,
          aiContent: errorText,
          userMetadata: data.metadata,
          aiMetadata: {
            actionResult: {
              success: false,
              code: "FORBIDDEN_ROLE",
              message: errorText,
            },
          },
        });
        this._recordLatency(Date.now() - startTime, 0);
        return {
          conversationId: conversation ? conversation._id : null,
          userMessage,
          aiMessage,
          sources: [],
          pendingAction: null,
          actionResult: {
            success: false,
            code: "FORBIDDEN_ROLE",
            message: errorText,
          },
          metadata: { lastIntent, lastProductId, pendingAction: null },
        };
      }

      // 2. Validate pendingAction: Anti-Replay, Expiration, Ownership, and Integrity
      const serverPending = conversation?.metadata?.pendingAction;
      const executedIds = Array.isArray(conversation?.metadata?.executedActionIds)
        ? conversation.metadata.executedActionIds
        : [];

      const candidateAction = data.confirmAction || serverPending;

      // Anti-Replay: Check if actionId was already executed or marked executed
      if (
        (candidateAction?.actionId && executedIds.includes(candidateAction.actionId)) ||
        serverPending?.executed === true ||
        candidateAction?.executed === true
      ) {
        const replayText =
          "⚠️ Thao tác thêm vào giỏ hàng này đã được thực thi trước đó (chống lặp lại). Vui lòng gửi yêu cầu mới nếu bạn muốn mua thêm.";
        const { userMessage, aiMessage } = await this._persistTurn({
          userId,
          conversation,
          userContent: data.content,
          aiContent: replayText,
          userMetadata: data.metadata,
          aiMetadata: {
            actionResult: {
              success: false,
              code: "REPLAY_BLOCKED",
              message: replayText,
            },
          },
        });
        this._recordLatency(Date.now() - startTime, 0);
        return {
          conversationId: conversation ? conversation._id : null,
          userMessage,
          aiMessage,
          sources: [],
          pendingAction: null,
          actionResult: {
            success: false,
            code: "REPLAY_BLOCKED",
            message: replayText,
          },
          metadata: { lastIntent, lastProductId, pendingAction: null },
        };
      }

      // Ownership check: Target pending action must belong to current user
      if (candidateAction?.userId && String(candidateAction.userId) !== String(userId)) {
        const crossUserText =
          "⚠️ Thao tác không hợp lệ: Yêu cầu xác nhận không thuộc về phiên đăng nhập của bạn.";
        const { userMessage, aiMessage } = await this._persistTurn({
          userId,
          conversation,
          userContent: data.content,
          aiContent: crossUserText,
          userMetadata: data.metadata,
          aiMetadata: {
            actionResult: {
              success: false,
              code: "CROSS_USER_FORBIDDEN",
              message: crossUserText,
            },
          },
        });
        this._recordLatency(Date.now() - startTime, 0);
        return {
          conversationId: conversation ? conversation._id : null,
          userMessage,
          aiMessage,
          sources: [],
          pendingAction: null,
          actionResult: {
            success: false,
            code: "CROSS_USER_FORBIDDEN",
            message: crossUserText,
          },
          metadata: { lastIntent, lastProductId, pendingAction: null },
        };
      }

      // Expiration check: Must be within TTL (10 minutes)
      const expiresAt = candidateAction?.expiresAt || serverPending?.expiresAt;
      if (expiresAt && Date.now() > Number(expiresAt)) {
        if (conversation) {
          conversation.metadata = { ...conversation.metadata, pendingAction: null };
          conversation.markModified("metadata");
          await conversation.save();
        }
        const expiredText =
          "⚠️ Yêu cầu xác nhận thêm giỏ hàng đã hết hạn sau 10 phút. Vui lòng gửi lại yêu cầu mới để kiểm tra lại giá và tồn kho nhé!";
        const { userMessage, aiMessage } = await this._persistTurn({
          userId,
          conversation,
          userContent: data.content,
          aiContent: expiredText,
          userMetadata: data.metadata,
          aiMetadata: {
            actionResult: {
              success: false,
              code: "EXPIRED",
              message: expiredText,
            },
          },
        });
        this._recordLatency(Date.now() - startTime, 0);
        return {
          conversationId: conversation ? conversation._id : null,
          userMessage,
          aiMessage,
          sources: [],
          pendingAction: null,
          actionResult: {
            success: false,
            code: "EXPIRED",
            message: expiredText,
          },
          metadata: { lastIntent, lastProductId, pendingAction: null },
        };
      }

      // Check client-supplied confirmAction for tampering (HMAC verification)
      if (data.confirmAction && data.confirmAction.actionToken) {
        const isValid = aiToolRegistry.verifyActionToken({
          actionId: data.confirmAction.actionId,
          userId: String(userId),
          items: data.confirmAction.items,
          expiresAt: data.confirmAction.expiresAt,
          actionToken: data.confirmAction.actionToken,
        });

        if (!isValid) {
          const invalidTokenText =
            "⚠️ Chữ ký xác thực hành động không hợp lệ hoặc dữ liệu sản phẩm đã bị can thiệp.";
          const { userMessage, aiMessage } = await this._persistTurn({
            userId,
            conversation,
            userContent: data.content,
            aiContent: invalidTokenText,
            userMetadata: data.metadata,
            aiMetadata: {
              actionResult: {
                success: false,
                code: "INVALID_ACTION_TOKEN",
                message: invalidTokenText,
              },
            },
          });
          this._recordLatency(Date.now() - startTime, 0);
          return {
            conversationId: conversation ? conversation._id : null,
            userMessage,
            aiMessage,
            sources: [],
            pendingAction: null,
            actionResult: {
              success: false,
              code: "INVALID_ACTION_TOKEN",
              message: invalidTokenText,
            },
            metadata: { lastIntent, lastProductId, pendingAction: null },
          };
        }
      }

      const targetPending = serverPending || candidateAction;

      // Cryptographic token integrity check (HMAC verification) on targetPending
      if (targetPending?.actionToken) {
        const isValid = aiToolRegistry.verifyActionToken({
          actionId: targetPending.actionId,
          userId: String(userId),
          items: targetPending.items,
          expiresAt: targetPending.expiresAt,
          actionToken: targetPending.actionToken,
        });

        if (!isValid) {
          const invalidTokenText =
            "⚠️ Chữ ký xác thực hành động không hợp lệ hoặc dữ liệu sản phẩm đã bị can thiệp.";
          const { userMessage, aiMessage } = await this._persistTurn({
            userId,
            conversation,
            userContent: data.content,
            aiContent: invalidTokenText,
            userMetadata: data.metadata,
            aiMetadata: {
              actionResult: {
                success: false,
                code: "INVALID_ACTION_TOKEN",
                message: invalidTokenText,
              },
            },
          });
          this._recordLatency(Date.now() - startTime, 0);
          return {
            conversationId: conversation ? conversation._id : null,
            userMessage,
            aiMessage,
            sources: [],
            pendingAction: null,
            actionResult: {
              success: false,
              code: "INVALID_ACTION_TOKEN",
              message: invalidTokenText,
            },
            metadata: { lastIntent, lastProductId, pendingAction: null },
          };
        }
      }

      // Mark action as executed immediately in DB before calling CartService (Anti-race/Anti-replay)
      if (conversation) {
        const updatedExecutedIds = Array.from(
          new Set([...executedIds, targetPending.actionId].filter(Boolean))
        );
        conversation.metadata = {
          ...conversation.metadata,
          executedActionIds: updatedExecutedIds,
          pendingAction: { ...targetPending, executed: true },
        };
        conversation.markModified("metadata");
        await conversation.save();
      }

      // Execute tool with isConfirmedByGate = true
      const execResult = await executeTool(
        "add_to_cart",
        { items: targetPending.items, confirmed: true },
        { userId, role: userRole, confirmed: true, isConfirmedByGate: true }
      );

      // Clear pendingAction after execution, keeping executedActionIds recorded
      pendingAction = null;
      if (userId && conversation) {
        conversation.metadata = {
          ...conversation.metadata,
          pendingAction: null,
        };
        conversation.markModified("metadata");
        await conversation.save();
      }

      // Ghi nhận sự kiện ai_cart_action_confirmed vào hệ thống tracking
      if (execResult?.success && process.env.NODE_ENV !== "test") {
        try {
          (execResult.addedItems || []).forEach((it) => {
            addTrackingJob({
              event_id: new mongoose.Types.ObjectId().toString(),
              user_id: userId ? userId.toString() : null,
              anonymous_id: null,
              event_type: "ai_cart_action_confirmed",
              product_id: it.product_id,
              meta: {
                quantity: it.quantity,
                price: it.unit_price,
                color: it.color,
                size: it.size,
              },
              timestamp: new Date().toISOString(),
            }).catch(() => {});
          });
        } catch {}
      }

      const aiResponseText = execResult?.success
        ? `✅ **${execResult.message}**\n` +
          (execResult.addedItems || [])
            .map(
              (it) =>
                `- **${it.name}** (${it.color}, Size ${it.size}) x${it.quantity} — ${(
                  it.unit_price * it.quantity
                ).toLocaleString("vi-VN")}đ`
            )
            .join("\n") +
          (execResult.cartSummary
            ? `\n\n🛒 Giỏ hàng hiện có **${execResult.cartSummary.total_items}** sản phẩm (Tổng: **${execResult.cartSummary.total_price_formatted}**).`
            : "")
        : `⚠️ Không thể thêm vào giỏ hàng: ${execResult?.message || "Vui lòng đăng nhập và thử lại."}`;

      const { userMessage, aiMessage } = await this._persistTurn({
        userId,
        conversation,
        userContent: data.content,
        aiContent: aiResponseText,
        userMetadata: data.metadata,
        aiMetadata: { actionResult: execResult },
      });

      this._recordLatency(Date.now() - startTime, 0);
      return {
        conversationId: userId && conversation ? conversation._id : null,
        userMessage,
        aiMessage,
        sources: [],
        pendingAction: null,
        actionResult: execResult,
        metadata: { lastIntent: "add_to_cart", lastProductId, pendingAction: null },
      };
    }

    // 4. Intercept short Vietnamese detail-request sentences ("có", "ok", "chi tiết", "xem")
    const shortSentences = [
      "có",
      "co",
      "ok",
      "okay",
      "oke",
      "được",
      "duoc",
      "xem",
      "xem đi",
      "xem di",
      "chi tiết",
      "chi tiet",
      "chi tiết đi",
      "chi tiet di",
    ];
    if (shortSentences.includes(cleanContent)) {
      let aiResponseText = "";
      let sources = [];
      if (lastProductId) {
        try {
          const detailResult = await executeTool(
            "get_product_details",
            { product_id: lastProductId },
            { userId, role: userRole }
          );

          if (detailResult && typeof detailResult === "object" && detailResult.name) {
            aiResponseText =
              `Dưới đây là thông tin chi tiết về sản phẩm **${detailResult.name}**:\n` +
              `- **Giá bán**: ${detailResult.new_price}\n` +
              `- **Đánh giá**: ${detailResult.rating || 0}/5⭐\n` +
              `- **Tồn kho**: ${detailResult.total_stock ?? 0} sản phẩm\n` +
              `- **Màu sắc có sẵn**: ${detailResult.available_colors?.join(", ") || "N/A"}\n` +
              `- **Kích thước có sẵn**: ${detailResult.available_sizes?.join(", ") || "N/A"}\n` +
              `- **Mô tả**: ${detailResult.description || "Chưa có mô tả chi tiết."}`;
            sources = [
              {
                index: 1,
                sourceId: detailResult.id,
                sourceType: "product",
                title: detailResult.name,
                url: `/product/${detailResult.slug || detailResult.id}`,
                score: 1,
                price: detailResult.price_number,
                image: detailResult.image,
              },
            ];
          } else {
            aiResponseText = `Dưới đây là thông tin chi tiết về sản phẩm:\n${JSON.stringify(detailResult)}`;
          }
        } catch {
          aiResponseText =
            "Đã xảy ra lỗi khi truy xuất thông tin sản phẩm. Bạn vui lòng thử lại sau nhé.";
        }
      } else {
        aiResponseText =
          "Chào bạn! Bạn muốn xem chi tiết sản phẩm nào ạ? Bạn vui lòng gửi tên hoặc mô tả sản phẩm để mình hỗ trợ nhé!";
      }

      const { userMessage, aiMessage } = await this._persistTurn({
        userId,
        conversation,
        userContent: data.content,
        aiContent: aiResponseText,
        userMetadata: data.metadata,
        aiMetadata: { sources },
      });

      this._recordLatency(Date.now() - startTime, 0);
      return {
        conversationId: userId && conversation ? conversation._id : null,
        userMessage,
        aiMessage,
        sources,
        metadata: { lastIntent, lastProductId, pendingAction },
      };
    }

    // 5. Handle support handoff keyword (e.g. "gặp nhân viên", "khiếu nại")
    if (this.needsHandoff(data.content)) {
      this.metrics.handoffCount++;
      if (userId && conversation) {
        const handoff = await this.handoffToSupport({
          userId,
          sourceConversationId: conversation._id,
          reason: data.content,
        });

        const userMessage = await messageService.createMessage(
          {
            conversationId: conversation._id,
            senderType: "user",
            senderId: userId,
            messageType: "text",
            content: data.content,
            metadata: data.metadata,
          },
          { userId, role: "user" }
        );

        this._recordLatency(Date.now() - startTime, 0);
        return {
          conversationId: conversation._id,
          userMessage,
          handoff,
        };
      }
    }

    // 6. Retrieve Grounded RAG Context before LLM invocation
    let ragRetrieval = { chunks: [], sources: [], promptInjectionDetected: false };
    try {
      ragRetrieval = await ragService.retrieveContext(
        data.content,
        { topK: 5, minScore: 0.24 },
        { userId, role: userRole }
      );
    } catch (ragErr) {
      logger.warn("RAG context retrieval skipped in AiChatService:", ragErr.message);
    }

    const formattedRagContext =
      ragRetrieval.chunks.length > 0
        ? ragRetrieval.chunks
            .map(
              (c) =>
                `[Nguồn #${c.index} | Loại: ${c.sourceType} | ID: ${c.sourceId}]\nTiêu đề: ${c.title}\nNội dung: ${c.content}`
            )
            .join("\n\n")
        : null;

    // 7. Build conversation history context
    let pastMessages = [];
    if (userId && conversation) {
      const recentMessages = await aiChatRepository.getRecentMessages(conversation._id, 14);
      pastMessages = recentMessages.reverse();
    } else {
      pastMessages = (data.history || []).slice(-14);
    }

    const productContext = await this.buildProductContext(lastProductId);

    // Truy xuất sở thích khách hàng để cá nhân hóa câu trả lời và đề xuất của AI
    let userProfileContext = null;
    if (userId && mongoose.connection?.readyState === 1) {
      try {
        const pCtx = await recommendationService.getPersonalizedContextForChat(userId, null);
        if (pCtx) {
          const parts = [];
          if (pCtx.topCategories?.length) parts.push(`Danh mục quan tâm: ${pCtx.topCategories.join(", ")}`);
          if (pCtx.topKeywords?.length) parts.push(`Từ khóa tìm kiếm gần đây: ${pCtx.topKeywords.join(", ")}`);
          if (pCtx.preferredColors?.length) parts.push(`Màu ưa thích: ${pCtx.preferredColors.join(", ")}`);
          if (pCtx.preferredSizes?.length) parts.push(`Size thường mặc: ${pCtx.preferredSizes.join(", ")}`);
          if (parts.length > 0) {
            userProfileContext = `[Hồ sơ sở thích khách hàng: ${parts.join("; ")}]`;
          }
        }
      } catch (_) {}
    }

    const aiMessages = [
      {
        role: "system",
        content: buildSystemPrompt({
          productContext,
          ragContext: formattedRagContext,
          userProfileContext,
        }),
      },
      ...pastMessages.map((message) => ({
        role: message.senderType === "ai" ? "assistant" : "user",
        content: message.content || "",
      })),
      { role: "user", content: data.content },
    ];

    // 8. Unified Tool Calling & Agentic Loop (max 5 iterations)
    let finalResponse = null;
    let iterations = 0;
    let totalTokensTurn = 0;
    let collectedProducts = [];
    let actionResult = null;
    const isCartActionIntent = aiToolRegistry.detectCartActionIntent(data.content);

    try {
      while (!finalResponse && iterations < 5) {
        iterations++;

        const response = await this.provider.chat({
          messages: aiMessages,
          tools: shopTools,
        });

        totalTokensTurn += Number(response.usage?.total_tokens || 0);
        const toolCalls = response.toolCalls || response.toolCall;

        if (toolCalls?.length) {
          aiMessages.push({
            role: "assistant",
            tool_calls: toolCalls,
          });

          for (const toolCall of toolCalls) {
            const result = await executeTool(toolCall.name, toolCall.args, {
              userId,
              role: userRole,
              confirmed: false,
            });

            if (toolCall.name === "search_products") {
              lastIntent = "search_products";
              if (Array.isArray(result) && result.length > 0) {
                collectedProducts = result;
                const recommendedId = result[0].id;
                if (recommendedId) {
                  lastProductId = String(recommendedId);
                }
                // Ghi nhận sự kiện ai_product_recommended vào tracking
                import("../../../queues/tracking.queue.js")
                  .then(({ addTrackingJob }) => {
                    result.slice(0, 5).forEach((p) => {
                      addTrackingJob({
                        event_id: new mongoose.Types.ObjectId().toString(),
                        user_id: userId ? userId.toString() : null,
                        anonymous_id: null,
                        event_type: "ai_product_recommended",
                        product_id: p.id,
                        meta: { name: p.name, price: p.price_number },
                        timestamp: new Date().toISOString(),
                      }).catch(() => {});
                    });
                  })
                  .catch(() => {});
              }
            }

            if (toolCall.name === "add_to_cart" && result && typeof result === "object") {
              lastIntent = "add_to_cart";
              if (result.status === "PENDING_CONFIRMATION") {
                pendingAction = {
                  actionType: "add_to_cart",
                  items: result.items,
                  totalEstimatedPrice: result.totalEstimatedPrice,
                  totalEstimatedPriceFormatted: result.totalEstimatedPriceFormatted,
                };
              } else {
                actionResult = result;
              }
            }

            aiMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            });
          }
          continue;
        }

        finalResponse = response.content;
      }
    } catch (llmError) {
      logger.warn("LLM provider failed in AiChatService, executing grounded fallback:", {
        error: llmError.message,
      });
      finalResponse = await this._buildFallbackAgentResponse(
        data.content,
        { userId, role: userRole },
        ragRetrieval
      );
    }

    // 9. If user requested "tìm X và thêm vào giỏ hàng" and search_products found items
    //    but LLM didn't call add_to_cart in the same turn, automatically prepare the confirmation gate!
    if (isCartActionIntent && !pendingAction && !actionResult) {
      if (collectedProducts.length === 0) {
        const searchRes = await executeTool(
          "search_products",
          { keyword: data.content, in_stock: true, limit: 5 },
          { userId, role: userRole }
        );
        if (Array.isArray(searchRes) && searchRes.length > 0) {
          collectedProducts = searchRes;
          lastProductId = String(searchRes[0].id);
        }
      }

      if (collectedProducts.length > 0) {
        const parsedNL = parseNaturalLanguageQuery(data.content);
        const targetCount = Math.min(
          parsedNL.extractedFilters.requestedQuantity || 1,
          collectedProducts.length,
          5
        );
        const itemsToPrepare = collectedProducts.slice(0, targetCount).map((p) => ({
          product_id: String(p.id),
          quantity: 1,
        }));

        const cartCheckRes = await executeTool(
          "add_to_cart",
          { items: itemsToPrepare, confirmed: false },
          { userId, role: userRole, confirmed: false }
        );

        if (cartCheckRes?.status === "PENDING_CONFIRMATION") {
          pendingAction = {
            actionId: cartCheckRes.actionId,
            actionType: "add_to_cart",
            userId: String(userId),
            items: cartCheckRes.items,
            totalEstimatedPrice: cartCheckRes.totalEstimatedPrice,
            totalEstimatedPriceFormatted: cartCheckRes.totalEstimatedPriceFormatted,
            actionToken: cartCheckRes.actionToken,
            expiresAt: cartCheckRes.expiresAt,
            executed: false,
          };
          if (!finalResponse || !finalResponse.includes("xác nhận")) {
            finalResponse =
              `${finalResponse ? finalResponse + "\n\n" : ""}` +
              `🛒 Mình đã chọn sẵn **${cartCheckRes.items.length}** sản phẩm còn hàng phù hợp với yêu cầu của bạn (Tổng tạm tính: **${cartCheckRes.totalEstimatedPriceFormatted}**). Bạn vui lòng bấm **Xác nhận** hoặc trả lời **"Xác nhận"** để mình thêm vào giỏ hàng nhé!`;
          }
        } else if (cartCheckRes && !cartCheckRes.success) {
          actionResult = cartCheckRes;
          if (cartCheckRes.code === "AUTH_REQUIRED") {
            finalResponse =
              `${finalResponse ? finalResponse + "\n\n" : ""}` +
              `⚠️ ${cartCheckRes.message}`;
          }
        }
      }
    }

    const aiResponseText =
      finalResponse ||
      "Xin lỗi bạn, hiện tại mình chưa tìm thấy thông tin phù hợp. Bạn vui lòng mô tả chi tiết hơn nhé!";

    // Update conversation metadata in DB
    if (userId && conversation) {
      conversation.metadata = {
        ...conversation.metadata,
        lastIntent,
        lastProductId,
        pendingAction,
      };
      conversation.markModified("metadata");
      await conversation.save();
    }

    const sources = ragRetrieval.sources || [];
    const { userMessage, aiMessage } = await this._persistTurn({
      userId,
      conversation,
      userContent: data.content,
      aiContent: aiResponseText,
      userMetadata: data.metadata,
      aiMetadata: {
        sources,
        pendingAction,
        actionResult,
      },
    });

    this._recordLatency(Date.now() - startTime, totalTokensTurn);

    return {
      conversationId: userId && conversation ? conversation._id : null,
      userMessage,
      aiMessage,
      sources,
      pendingAction,
      actionResult,
      metadata: {
        lastIntent,
        lastProductId,
        pendingAction,
        promptInjectionDetected: ragRetrieval.promptInjectionDetected,
      },
    };
  }

  async _buildFallbackAgentResponse(content, authContext, ragRetrieval) {
    const searchRes = await executeTool(
      "search_products",
      { keyword: content, limit: 4 },
      authContext
    );

    if (Array.isArray(searchRes) && searchRes.length > 0) {
      const lines = ["Dưới đây là các sản phẩm phù hợp tìm thấy trong hệ thống 404Studio:"];
      for (const p of searchRes) {
        lines.push(
          `- **${p.name}** - Giá: ${p.new_price}${
            p.image ? ` - Link ảnh: ${p.image}` : ""
          } - ID sản phẩm: \`${p.id}\``
        );
      }
      return lines.join("\n");
    }

    if (ragRetrieval?.chunks?.length > 0) {
      return ragService._buildDeterministicGroundedAnswer(ragRetrieval.chunks);
    }

    return "Xin lỗi bạn, hiện tại hệ thống chưa tìm thấy sản phẩm hoặc thông tin khớp với yêu cầu này tại 404Studio.";
  }

  async handoffToSupport({ userId, sourceConversationId, reason }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const admin = await assignmentService.findAvailableAdmin();
      const supportConversation = await conversationService.createConversation(
        {
          customerId: userId,
          type: "support",
          status: admin ? "waiting_customer" : "waiting_admin",
          assignedAdminId: admin?._id,
          source: "ai_handoff",
          metadata: { sourceConversationId, reason },
        },
        { session, skipConversationCheck: true }
      );

      await messageService.copyConversationMessages(
        sourceConversationId,
        supportConversation._id,
        { session }
      );
      await messageService.createMessage(
        {
          conversationId: supportConversation._id,
          senderType: "system",
          senderId: null,
          messageType: "system",
          content: `AI handoff: ${reason}`,
          metadata: { sourceConversationId },
        },
        { userId, role: "admin" },
        { session }
      );

      await session.commitTransaction();
      return supportConversation;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

export default new AiChatService();
