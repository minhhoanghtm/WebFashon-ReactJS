import fs from 'fs';

const filePath = 'back-end/src/modules/communication/aiChat/aiChat.service.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Tool result serialization guard
const oldToolPush = `            aiMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            });`;

const newToolPush = `            let serializedResult = "";
            try {
              serializedResult = JSON.stringify(result);
            } catch {
              serializedResult = String(result?.message || result || "{}");
            }
            aiMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: serializedResult,
            });`;

content = content.replace(oldToolPush.replace(/\r\n/g, '\n'), newToolPush);
content = content.replace(oldToolPush.replace(/\n/g, '\r\n'), newToolPush.replace(/\n/g, '\r\n'));

// 2. Safe _buildFallbackAgentResponse
const oldFallback = `  async _buildFallbackAgentResponse(content, authContext, ragRetrieval) {
    const searchRes = await executeTool(
      "search_products",
      { keyword: content, limit: 4 },
      authContext
    );

    if (Array.isArray(searchRes) && searchRes.length > 0) {
      return {
        text: "Dưới đây là các mẫu thiết kế phù hợp đang có sẵn tại 404Studio:",
        products: searchRes,
      };
    }

    if (ragRetrieval?.chunks?.length > 0) {
      return {
        text: ragService._buildDeterministicGroundedAnswer(ragRetrieval.chunks),
        products: [],
      };
    }

    return {
      text: "Xin lỗi bạn, hiện tại hệ thống chưa tìm thấy sản phẩm hoặc thông tin khớp với yêu cầu này tại 404Studio.",
      products: [],
    };
  }`;

const newFallback = `  async _buildFallbackAgentResponse(content, authContext, ragRetrieval) {
    try {
      const searchRes = await executeTool(
        "search_products",
        { keyword: content, limit: 4 },
        authContext
      );

      if (Array.isArray(searchRes) && searchRes.length > 0) {
        return {
          text: "Dưới đây là các mẫu thiết kế phù hợp đang có sẵn tại 404Studio:",
          products: searchRes,
        };
      }

      if (ragRetrieval?.chunks?.length > 0) {
        return {
          text: ragService._buildDeterministicGroundedAnswer(ragRetrieval.chunks),
          products: [],
        };
      }
    } catch (fallbackErr) {
      logger.warn("Error inside _buildFallbackAgentResponse:", fallbackErr.message);
    }

    return {
      text: "Xin lỗi bạn, hiện tại hệ thống chưa tìm thấy sản phẩm hoặc thông tin khớp với yêu cầu này tại 404Studio.",
      products: [],
    };
  }`;

content = content.replace(oldFallback.replace(/\r\n/g, '\n'), newFallback);
content = content.replace(oldFallback.replace(/\n/g, '\r\n'), newFallback.replace(/\n/g, '\r\n'));

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched aiChat.service.js with resilience improvements!');
