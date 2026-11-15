import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Sparkles, Send, Bot, User } from "lucide-react";
import { aiApi } from "../../api/endpoints";
import { useUiStore } from "../../stores/uiStore";

export function AiAssistantModal() {
  const isOpen = useUiStore((state) => state.isAiModalOpen);
  const onClose = useUiStore((state) => state.closeAiModal);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Xin chào! Tôi là Trợ lý Mua sắm Thông minh của Atelier. Bạn đang tìm trang phục cho sự kiện đặc biệt, phong cách thường nhật hay cần tư vấn phối size?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    const newHistory = [...messages, { sender: "user", text: userText }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const res = await aiApi.chat({
        message: userText,
        history: newHistory.map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
      });

      const replyText =
        res.data?.reply ||
        res.reply ||
        res.data?.message ||
        "Atelier gợi ý bạn tham khảo bộ sưu tập Áo Blazer Dạ Cashmere và Quần Tây May Đo Đương Đại hiện đang sẵn sàng tại cửa hàng.";

      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: replyText,
          recommendations: res.data?.recommendations || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "Chúng tôi đề xuất các thiết kế signature thuộc bộ sưu tập Haute Tailoring mùa này: Áo Khoác Bomber Unisex và Quần Jeans Ống Rộng.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trợ Lý Mua Sắm AI" maxWidth="max-w-2xl">
      <div className="flex flex-col h-[520px]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "assistant" && (
                <div className="w-8 h-8 rounded-none bg-[#e65100]/20 border border-[#e65100]/40 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-[#e65100]" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3.5 text-sm ${
                  msg.sender === "user"
                    ? "bg-[#e65100] text-white"
                    : "bg-[#1e1e23] border border-[rgba(244,240,232,0.1)] text-[#f4f0e8]"
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#9a989f]">
                      Sản phẩm gợi ý:
                    </span>
                    {msg.recommendations.map((rec, rIdx) => (
                      <div key={rIdx} className="text-xs font-semibold text-white">
                        • {rec.name} — {rec.price?.toLocaleString("vi-VN")} ₫
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {msg.sender === "user" && (
                <div className="w-8 h-8 rounded-none bg-[#25252b] border border-[rgba(244,240,232,0.1)] flex items-center justify-center shrink-0">
                  <User size={16} className="text-[#f4f0e8]" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#9a989f] italic">
              <Sparkles size={14} className="text-[#e65100] animate-spin" />
              <span>Atelier AI đang phân tích dữ liệu may đo...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="mt-4 pt-3 border-t border-[rgba(244,240,232,0.1)] flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi về phong cách, phối màu hoặc chọn size..."
            className="flex-1 min-h-[44px] px-3.5 bg-[#121215] border border-[rgba(244,240,232,0.15)] focus:border-[#e65100] text-sm text-[#f4f0e8] placeholder-[#6b6973]"
          />
          <Button type="submit" variant="signal" size="md" disabled={isLoading || !input.trim()}>
            <Send size={16} />
          </Button>
        </form>
      </div>
    </Modal>
  );
}
