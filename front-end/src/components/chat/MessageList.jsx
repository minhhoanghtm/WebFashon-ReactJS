import React, { useRef, useEffect } from "react";
import { Sparkles, Headphones, Bot, LogIn, X } from "lucide-react";
import MessageBubble from "./MessageBubble";

export const MessageList = ({
  activeTab, // 'ai' | 'support'
  messages = [],
  loading = false,
  isAuthenticated = false,
  user = null,
  siteName = "404STUDIO",
  context = null,
  onClearContext = null,
  quickSuggestions = [],
  onSelectSuggestion = null,
  onLoginRedirect = null,
  onActionConfirm = null,
  onActionCancel = null,
  onRetry = null,
  onAskProductDetails = null,
}) => {
  const containerRef = useRef(null);
  const isNearBottomRef = useRef(true);

  // Check if scroll is near bottom
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 80;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceToBottom <= threshold;
  };

  // Auto-scroll when new messages arrive, only if user was near bottom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (isNearBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading, activeTab]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      aria-live="polite"
      className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 bg-background"
    >
      {/* Product context chip if user is looking at a product */}
      {context?.productName && (
        <div className="flex items-center justify-between gap-2 border border-border bg-muted/60 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 truncate">
            {context.image && (
              <img
                src={context.image}
                alt={context.productName}
                className="h-7 w-7 shrink-0 object-cover border border-border"
              />
            )}
            <div className="truncate text-left">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                Đang xem sản phẩm
              </span>
              <span className="truncate font-semibold text-foreground">
                {context.productName}
              </span>
            </div>
          </div>
          {onClearContext && (
            <button
              type="button"
              onClick={onClearContext}
              aria-label="Bỏ ngữ cảnh sản phẩm"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Staff tab: Unauthenticated prompt */}
      {activeTab === "support" && !isAuthenticated && (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 border border-border bg-card my-4">
          <div className="flex h-12 w-12 items-center justify-center border border-border bg-muted text-foreground">
            <Headphones className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Đăng nhập để gặp nhân viên
            </h4>
            <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
              Vui lòng đăng nhập tài khoản để được đội ngũ chăm sóc khách hàng {siteName} hỗ trợ trực tiếp.
            </p>
          </div>
          <button
            type="button"
            onClick={onLoginRedirect}
            className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 active:scale-98 transition-all"
          >
            <LogIn className="h-4 w-4" />
            <span>Đăng nhập ngay</span>
          </button>
        </div>
      )}

      {/* Welcome banner */}
      {activeTab === "ai" ? (
        <div className="flex gap-2.5 items-start text-left">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-muted text-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div className="max-w-[85%] border border-border bg-card p-3 text-xs leading-relaxed text-card-foreground">
            <p className="font-semibold text-foreground mb-1">
              Xin chào {user?.fullName || "quý khách"}!
            </p>
            <p className="text-muted-foreground">
              Tôi là AI Stylist của {siteName}. Tôi có thể gợi ý phối đồ, tư vấn kích cỡ và kiểm tra tình trạng sản phẩm cho bạn.
            </p>
          </div>
        </div>
      ) : isAuthenticated ? (
        <div className="space-y-2">
          <div className="flex gap-2.5 items-start text-left">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-muted text-foreground">
              <Headphones className="h-4 w-4" />
            </div>
            <div className="max-w-[85%] border border-border bg-card p-3 text-xs leading-relaxed text-card-foreground">
              <p className="font-semibold text-foreground mb-1">
                Kênh hỗ trợ trực tiếp {siteName}
              </p>
              <p className="text-muted-foreground">
                Bạn có thể để lại câu hỏi về đơn hàng, vận chuyển hoặc thanh toán tại đây.
              </p>
            </div>
          </div>
          {/* Truthful disclaimer */}
          <div className="border-l-2 border-border pl-2.5 py-1 text-[11px] text-muted-foreground text-left">
            Tin nhắn được lưu trữ an toàn. Đội ngũ nhân viên sẽ phản hồi sớm nhất khi trực tuyến.
          </div>
        </div>
      ) : null}

      {/* Quick Suggestion Chips (AI Mode) */}
      {activeTab === "ai" && messages.length === 0 && quickSuggestions.length > 0 && (
        <div className="space-y-1.5 pt-1 text-left">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Gợi ý nhanh
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickSuggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectSuggestion?.(sug)}
                className="border border-border bg-background px-2.5 py-1 text-[11px] text-foreground transition-colors hover:border-foreground hover:bg-muted active:scale-98"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Render All Messages */}
      {messages.map((msg) => (
        <MessageBubble
          key={msg._id}
          message={msg}
          onActionConfirm={onActionConfirm}
          onActionCancel={onActionCancel}
          onRetry={onRetry}
          onAskProductDetails={onAskProductDetails}
        />
      ))}

      {/* AI Thinking Indicator */}
      {loading && activeTab === "ai" && (
        <div className="flex gap-2.5 items-center text-left">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-muted text-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div className="border border-border bg-card px-3 py-2 text-xs italic text-muted-foreground flex items-center gap-2">
            <span>AI Stylist đang phản hồi</span>
            <span className="flex gap-1">
              <span className="h-1 w-1 bg-foreground animate-ping" />
              <span className="h-1 w-1 bg-foreground animate-ping delay-100" />
              <span className="h-1 w-1 bg-foreground animate-ping delay-200" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
