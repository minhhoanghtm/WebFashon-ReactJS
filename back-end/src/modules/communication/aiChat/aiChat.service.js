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

const handoffPatterns = [
  /khi[eê]u n[aạ]i/i,
  /ho[aà]n ti[eề]n/i,
  /tr[aả] h[aà]ng/i,
  /[đd][oơ]n h[aà]ng/i,
  /g[aặ]p nh[aâ]n vi[eê]n/i,
  /h[oỗ] tr[oợ] ng[uư][oờ]i/i,
];

class AiChatService {
  get provider() {
    if (!this._provider) {
      this._provider = createAIProvider();
    }
    return this._provider;
  }

  needsHandoff(content) {
    return handoffPatterns.some((pattern) => pattern.test(content));
  }

  async buildProductContext(productId) {
    if (!productId) return null;
    return productFacade.getProductDetail(productId);
  }

  async sendMessage(userId, payload) {
    const data = validateTextMessageDto(payload);

    // 1. Get or create conversation if authenticated
    let conversation = null;
    if (userId) {
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

    if (userId && conversation) {
      if (!conversation.metadata) {
        conversation.metadata = {};
      }

      let metadataChanged = false;
      if (data.currentProductId && conversation.metadata.lastProductId !== data.currentProductId) {
        conversation.metadata.lastProductId = data.currentProductId;
        metadataChanged = true;
      }

      if (metadataChanged) {
        conversation.markModified("metadata");
        await conversation.save();
      }

      if (conversation.metadata.lastProductId) {
        lastProductId = conversation.metadata.lastProductId;
      }
      if (conversation.metadata.lastIntent) {
        lastIntent = conversation.metadata.lastIntent;
      }
    }

    // 3. Intercept short Vietnamese/agreement/detail-request sentences on backend
    const cleanContent = data.content.trim().toLowerCase().normalize("NFC");
    const shortSentences = ["có", "co", "ok", "okay", "oke", "được", "duoc", "xem", "xem đi", "xem di", "chi tiết", "chi tiet", "chi tiết đi", "chi tiet di"];
    const isShortSentence = shortSentences.includes(cleanContent);

    if (isShortSentence) {
      let aiResponseText = "";
      if (lastProductId) {
        try {
          const detailResult = await executeTool(
            "get_product_detail",
            { product_id: lastProductId },
            { userId }
          );

          if (detailResult && typeof detailResult === "object" && detailResult.name) {
            aiResponseText = `Dưới đây là thông tin chi tiết về sản phẩm **${detailResult.name}**:\n` +
              `- **Giá bán**: ${detailResult.new_price}\n` +
              `- **Đánh giá**: ${detailResult.rating || 0}/5⭐\n` +
              `- **Màu sắc có sẵn**: ${detailResult.available_colors?.join(", ") || "N/A"}\n` +
              `- **Kích thước có sẵn**: ${detailResult.available_sizes?.join(", ") || "N/A"}\n` +
              `- **Mô tả**: ${detailResult.description || "Chưa có mô tả chi tiết."}`;
          } else {
            aiResponseText = `Dưới đây là thông tin chi tiết về sản phẩm:\n${JSON.stringify(detailResult)}`;
          }
        } catch (err) {
          aiResponseText = "Đã xảy ra lỗi khi truy xuất thông tin sản phẩm. Bạn vui lòng thử lại sau nhé.";
        }
      } else {
        aiResponseText = "Chào bạn! Bạn muốn xem chi tiết sản phẩm nào ạ? Bạn vui lòng gửi tên hoặc link sản phẩm để mình hỗ trợ nhé!";
      }

      // Save user message to database if authenticated
      let userMessage = {
        senderType: "user",
        content: data.content,
        createdAt: new Date(),
      };
      if (userId && conversation) {
        userMessage = await messageService.createMessage(
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
      }

      // Save AI reply to database if authenticated
      let aiMessage = {
        senderType: "ai",
        content: aiResponseText,
        createdAt: new Date(),
      };
      if (userId && conversation) {
        aiMessage = await messageService.createMessage(
          {
            conversationId: conversation._id,
            senderType: "ai",
            senderId: null,
            messageType: "text",
            content: aiResponseText,
          },
          { userId, role: "user" }
        );
      }

      return {
        conversationId: userId ? conversation._id : null,
        userMessage,
        aiMessage,
        metadata: {
          lastIntent,
          lastProductId,
        },
      };
    }

    // 4. Handle support handoff keyword (e.g. "gặp nhân viên")
    if (this.needsHandoff(data.content)) {
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

        return {
          conversationId: conversation._id,
          userMessage,
          handoff,
        };
      }
    }

    // 5. Build conversation history context
    let pastMessages = [];
    if (userId && conversation) {
      const recentMessages = await aiChatRepository.getRecentMessages(
        conversation._id,
        20,
      );
      pastMessages = recentMessages.reverse();
    } else {
      pastMessages = data.history || [];
    }

    const productContext = await this.buildProductContext(lastProductId);
    const aiMessages = [
      { role: "system", content: buildSystemPrompt({ productContext }) },
      ...pastMessages.map((message) => ({
        role: message.senderType === "ai" ? "assistant" : "user",
        content: message.content,
      })),
      { role: "user", content: data.content },
    ];

    // 6. Unified Tool Calling loop (max 5 iterations)
    let finalResponse = null;
    let iterations = 0;

    while (!finalResponse && iterations < 5) {
      iterations++;

      const response = await this.provider.chat({
        messages: aiMessages,
        tools: shopTools,
      });

      console.log(`Iteration ${iterations} - Response:`, JSON.stringify(response, null, 2));

      const toolCalls = response.toolCalls || response.toolCall;

      if (toolCalls?.length) {
        aiMessages.push({
          role: "assistant",
          tool_calls: toolCalls,
        });

        for (const toolCall of toolCalls) {
          const result = await executeTool(
            toolCall.name,
            toolCall.args,
            { userId }
          );

          console.log(`Tool Result for ${toolCall.name}:`, JSON.stringify(result, null, 2));

          // Post-tool actions (saving metadata context)
          if (toolCall.name === "search_products") {
            lastIntent = "search_products";
            if (Array.isArray(result) && result.length > 0) {
              const recommendedId = result[0].id;
              if (recommendedId) {
                lastProductId = recommendedId;
              }
            }

            // Save to database if authenticated
            if (userId && conversation) {
              conversation.metadata = {
                ...conversation.metadata,
                lastIntent,
                lastProductId,
              };
              conversation.markModified("metadata");
              await conversation.save();
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

    const aiResponseText = finalResponse || "";

    // 7. Save and return results
    let userMessage = {
      senderType: "user",
      content: data.content,
      createdAt: new Date(),
    };
    if (userId && conversation) {
      userMessage = await messageService.createMessage(
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
    }

    let aiMessage = {
      senderType: "ai",
      content: aiResponseText,
      createdAt: new Date(),
    };
    if (userId && conversation) {
      aiMessage = await messageService.createMessage(
        {
          conversationId: conversation._id,
          senderType: "ai",
          senderId: null,
          messageType: "text",
          content: aiResponseText,
        },
        { userId, role: "user" }
      );
    }

    return {
      conversationId: userId ? conversation._id : null,
      userMessage,
      aiMessage,
      metadata: {
        lastIntent,
        lastProductId,
      },
    };
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
        { session, skipConversationCheck: true },
      );

      await messageService.copyConversationMessages(
        sourceConversationId,
        supportConversation._id,
        { session },
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
        { session },
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
}

export default new AiChatService();
