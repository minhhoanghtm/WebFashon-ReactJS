import React from "react";
import { Bot, Headphones, User, AlertCircle, Check, RotateCw } from "lucide-react";
import Markdown from "@/components/Markdown";
import ProductSuggestionCard from "./ProductSuggestionCard";
import { parseInlineProducts } from "@/hooks/useAiChat";

const formatTime = (isoString) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
};

export const MessageBubble = ({
  message,
  onActionConfirm,
  onActionCancel,
  onRetry,
  onAskProductDetails,
}) => {
  const isUser = message.senderType === "user";
  const isAi = message.senderType === "ai";
  const isSystem = message.senderType === "system";
  const timeStr = formatTime(message.createdAt);

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="bg-muted px-2.5 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {message.content}
        </span>
      </div>
    );
  }

  // Parse inline products if AI message
  const { cleanedContent, items } = isAi
    ? parseInlineProducts(message.content)
    : { cleanedContent: message.content, items: [] };

  const pendingAction = message.metadata?.pendingAction;
  const actionResult = message.metadata?.actionResult;
  const sources = Array.isArray(message.metadata?.sources)
    ? message.metadata.sources.slice(0, 3)
    : [];

  return (
    <div
      className={`group flex gap-2.5 ${
        isUser ? "flex-row-reverse" : "flex-row"
      } items-start text-left`}
    >
      {/* Avatar Icon */}
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-muted text-foreground">
          {isAi ? (
            <Bot className="h-4 w-4" />
          ) : (
            <Headphones className="h-4 w-4" />
          )}
        </div>
      )}

      {/* Bubble Content */}
      <div
        className={`flex max-w-[85%] flex-col ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`px-3.5 py-2.5 text-xs leading-relaxed transition-all ${
            isUser
              ? "bg-primary text-primary-foreground font-normal"
              : "border border-border bg-card text-card-foreground"
          } ${message.isFailed ? "border-destructive/60 bg-destructive/10" : ""}`}
        >
          {/* Main text content */}
          {cleanedContent && (
            <div className="prose-chat break-words">
              {isUser ? (
                <p className="whitespace-pre-wrap">{cleanedContent}</p>
              ) : (
                <Markdown>{cleanedContent}</Markdown>
              )}
            </div>
          )}

          {/* Inline Product Cards */}
          {items.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {items.map((prod, idx) => (
                <ProductSuggestionCard
                  key={idx}
                  item={prod}
                  position={idx + 1}
                  onAskDetails={onAskProductDetails}
                />
              ))}
            </div>
          )}

          {/* Pending Action Confirmation Gate (e.g. add_to_cart) */}
          {pendingAction?.actionType === "add_to_cart" &&
            Array.isArray(pendingAction.items) &&
            pendingAction.items.length > 0 && (
              <div className="mt-3 border border-border bg-muted/40 p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-foreground">
                  <span>Xác nhận thêm giỏ hàng</span>
                  <span>{pendingAction.totalEstimatedPriceFormatted}</span>
                </div>
                <div className="space-y-1 text-[11px] text-muted-foreground border-y border-border/60 py-1.5">
                  {pendingAction.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span className="truncate">
                        {it.name} ({it.color}/{it.size}) × {it.quantity}
                      </span>
                      <span className="shrink-0 font-medium text-foreground tabular-nums">
                        {(it.unit_price * it.quantity).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onActionConfirm?.(pendingAction)}
                    className="flex-1 bg-primary py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90 active:scale-98"
                  >
                    ✓ Xác nhận thêm
                  </button>
                  <button
                    type="button"
                    onClick={() => onActionCancel?.(pendingAction)}
                    className="border border-border bg-background px-3 py-1.5 text-[10px] font-medium text-foreground hover:bg-muted active:scale-98"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

          {/* Action Result Badge */}
          {actionResult?.status === "EXECUTED" && (
            <div className="mt-2 inline-flex items-center gap-1.5 border border-border bg-muted px-2 py-1 text-[10px] font-medium text-foreground">
              <Check className="h-3 w-3" />
              <span>{actionResult.message || "Đã thêm giỏ hàng thành công"}</span>
            </div>
          )}

          {/* Sources list */}
          {sources.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-border/40 pt-1.5 text-[10px] text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Nguồn:</span>
              {sources.map((src, sIdx) =>
                src.url ? (
                  <a
                    key={sIdx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate max-w-[120px] underline hover:text-foreground"
                  >
                    {src.title || "Tài liệu"}
                  </a>
                ) : (
                  <span key={sIdx} className="truncate max-w-[120px]">
                    {src.title}
                  </span>
                )
              )}
            </div>
          )}

          {/* Failed message state */}
          {message.isFailed && (
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-destructive/30 pt-2 text-destructive">
              <span className="flex items-center gap-1 text-[11px]">
                <AlertCircle className="h-3.5 w-3.5" />
                Không thể gửi tin nhắn
              </span>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold underline hover:text-destructive/80"
                >
                  <RotateCw className="h-3 w-3" />
                  Thử lại
                </button>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        {timeStr && (
          <span className="mt-1 px-1 text-[10px] tabular-nums text-muted-foreground">
            {timeStr}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
