import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";
import { sendCustomerAiMessageService } from "@/services/chat.service";
import trackingService from "@/services/tracking.service";
import { toast } from "react-toastify";

const DEFAULT_QUICK_SUGGESTIONS = [
  "Tư vấn phối đồ tối giản",
  "Hướng dẫn chọn size chuẩn",
  "Sản phẩm mới nhất",
  "Chính sách đổi trả & bảo hành",
];

export const parseInlineProducts = (content) => {
  if (typeof content !== "string") return { cleanedContent: "", items: [] };

  const items = [];
  let cleanedContent = content;

  const regex =
    /(?:[*+-]|\d+\.)\s+\*\*(.*?)\*\*[\s*]*[*+-]?\s*(?:Giá|Gia|Price):\s*([^*+-|\d.]+)(?:[\s*]*[*+-]?\s*(?:Link ảnh|Link anh|Image|Link):\s*(https?:\/\/\S+))?(?:\s*[*+-]?\s*(?:ID sản phẩm|ID san pham|ID):\s*`?([a-f0-9]+)`?)?/gi;

  let match;
  while ((match = regex.exec(content)) !== null) {
    const rawBlock = match[0];
    const name = match[1].trim();
    const price = match[2].trim();
    const image = match[3] ? match[3].trim() : null;
    const id = match[4] ? match[4].trim() : null;

    items.push({ name, price, image, id, rawBlock });
    cleanedContent = cleanedContent.replace(rawBlock, "");
  }

  cleanedContent = cleanedContent.replace(/\s+/g, " ").trim();
  return { cleanedContent, items };
};

export const useAiChat = ({ context, onHandoff } = {}) => {
  const { isAuthenticated, user } = useAuthStore();
  const userKey = user?._id || user?.id || "guest";
  const storageKey = `customer_ai_chat_history_${userKey}`;
  const metadataKey = `customer_ai_chat_metadata_${userKey}`;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) || [] : [];
    } catch {
      return [];
    }
  });

  const [aiMetadata, setAiMetadata] = useState(() => {
    try {
      const saved = localStorage.getItem(metadataKey);
      return saved
        ? JSON.parse(saved) || { lastIntent: null, lastProductId: null }
        : { lastIntent: null, lastProductId: null };
    } catch {
      return { lastIntent: null, lastProductId: null };
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const lastFailedMessageRef = useRef(null);
  const isLoadedRef = useRef(false);

  // Sync state on user change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setMessages(saved ? JSON.parse(saved) || [] : []);
      const savedMeta = localStorage.getItem(metadataKey);
      setAiMetadata(
        savedMeta
          ? JSON.parse(savedMeta) || { lastIntent: null, lastProductId: null }
          : { lastIntent: null, lastProductId: null }
      );
    } catch {
      setMessages([]);
      setAiMetadata({ lastIntent: null, lastProductId: null });
    } finally {
      isLoadedRef.current = true;
    }
  }, [storageKey, metadataKey]);

  // Persist messages
  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.error("Lỗi lưu lịch sử AI chat:", e);
    }
  }, [messages, storageKey]);

  // Persist metadata
  const updateMetadata = useCallback(
    (newMeta) => {
      setAiMetadata(newMeta);
      try {
        localStorage.setItem(metadataKey, JSON.stringify(newMeta));
      } catch (e) {
        console.error("Lỗi lưu metadata AI chat:", e);
      }
    },
    [metadataKey]
  );

  const sendMessage = useCallback(
    async (text, customMetadata = null, extraPayload = {}) => {
      const trimmed = (text || "").trim();
      if (!trimmed && !extraPayload.confirmAction && !extraPayload.cancelAction) {
        return;
      }

      setLoading(true);
      setError(null);

      const tempUserMsg = {
        _id: `temp_${Date.now()}`,
        senderType: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMsg]);
      const metaToSend = customMetadata || aiMetadata;

      try {
        const res = await sendCustomerAiMessageService({
          content: trimmed,
          conversationId: activeConversationId || undefined,
          history: !isAuthenticated ? messages : undefined,
          currentProductId: context?.productid || undefined,
          metadata: metaToSend,
          ...extraPayload,
        });

        if (res?.conversationId) {
          setActiveConversationId(res.conversationId);
        }

        if (res?.metadata) {
          updateMetadata(res.metadata);
        }

        // Cart sync
        if (res?.actionResult?.status === "EXECUTED") {
          const totalQty = res.actionResult?.cartSummary?.total_items;
          if (totalQty !== undefined) {
            window.dispatchEvent(
              new CustomEvent("cartUpdated", {
                detail: { totalQuantity: totalQty },
              })
            );
          }
          toast.success(
            res.actionResult.message || "Đã thêm vào giỏ hàng thành công!"
          );
        }

        // Handoff to human staff
        if (res?.handoff) {
          toast.info("Đã chuyển kết nối tới Nhân viên chăm sóc khách hàng!");
          if (onHandoff) onHandoff();
        } else if (res?.aiMessage) {
          const enrichedAiMessage = {
            ...res.aiMessage,
            metadata: {
              ...(res.aiMessage.metadata || {}),
              sources: res.sources || res.aiMessage.metadata?.sources || [],
              pendingAction:
                res.pendingAction ??
                res.aiMessage.metadata?.pendingAction ??
                null,
              actionResult:
                res.actionResult ??
                res.aiMessage.metadata?.actionResult ??
                null,
            },
          };

          // Track recommended products
          if (enrichedAiMessage?.content) {
            const { items } = parseInlineProducts(enrichedAiMessage.content);
            if (Array.isArray(items) && items.length > 0) {
              items.forEach((item, idx) => {
                trackingService.trackAIProductRecommended?.(
                  { id: item.id, _id: item.id, name: item.name },
                  { position: idx + 1, price: item.price }
                );
              });
            }
          }

          setMessages((prev) => {
            const filtered = prev.filter((m) => m._id !== tempUserMsg._id);
            return [
              ...filtered,
              res.userMessage || tempUserMsg,
              enrichedAiMessage,
            ];
          });
        }
        lastFailedMessageRef.current = null;
      } catch (err) {
        console.error("Lỗi khi gửi tin nhắn AI:", err);
        const errMsg =
          err?.response?.data?.message ||
          "Không thể nhận phản hồi từ AI lúc này. Vui lòng thử lại.";
        setError(errMsg);
        lastFailedMessageRef.current = { text, customMetadata, extraPayload };

        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempUserMsg._id ? { ...m, isFailed: true } : m
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [
      aiMetadata,
      activeConversationId,
      isAuthenticated,
      messages,
      context?.productid,
      updateMetadata,
      onHandoff,
    ]
  );

  const retryLastMessage = useCallback(() => {
    if (!lastFailedMessageRef.current) return;
    const { text, customMetadata, extraPayload } = lastFailedMessageRef.current;
    // remove failed message from state before retrying
    setMessages((prev) => prev.filter((m) => !m.isFailed));
    sendMessage(text, customMetadata, extraPayload);
  }, [sendMessage]);

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(metadataKey);
    } catch (e) {
      console.error("Lỗi xóa lịch sử:", e);
    }
    setMessages([]);
    setAiMetadata({ lastIntent: null, lastProductId: null });
    setActiveConversationId(null);
    setError(null);
    lastFailedMessageRef.current = null;
  }, [storageKey, metadataKey]);

  return {
    messages,
    loading,
    error,
    aiMetadata,
    quickSuggestions: DEFAULT_QUICK_SUGGESTIONS,
    sendMessage,
    retryLastMessage,
    clearHistory,
    updateMetadata,
  };
};
