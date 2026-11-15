import React, { useState, useEffect, useRef } from "react";
import { X, Trash2, Wifi, WifiOff } from "lucide-react";
import ChatTabs from "./ChatTabs";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

export const ChatPanel = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  siteName = "404STUDIO",
  // AI props
  aiMessages = [],
  aiLoading = false,
  quickSuggestions = [],
  onSendAiMessage,
  onClearAiHistory,
  onRetryAi,
  // Support props
  supportMessages = [],
  supportSending = false,
  supportSocketStatus = "disconnected",
  unreadSupportCount = 0,
  onSendSupportMessage,
  onRetrySupport,
  // Shared
  user = null,
  isAuthenticated = false,
  context = null,
  onClearContext = null,
  inputDraft = "",
  onInputDraftChange = null,
  onLoginRedirect = null,
  onActionConfirm = null,
  onActionCancel = null,
  onAskProductDetails = null,
}) => {
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [isActive, setIsActive] = useState(true);

  // Sync active state on render when isOpen prop toggles (React 19 pattern)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    setIsActive(isOpen);
  }

  // Esc key listener to close dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Autofocus input when opening dialog -> ensures active header
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab]);

  // Click / Pointerdown outside panel: mark inactive (WITHOUT closing panel)
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsActive(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    return () => document.removeEventListener("pointerdown", handlePointerDownOutside);
  }, [isOpen]);

  const handleFocus = () => {
    setIsActive(true);
  };

  const handleBlur = (e) => {
    if (!panelRef.current?.contains(e.relatedTarget)) {
      setIsActive(false);
    }
  };

  const handlePointerDownInside = () => {
    setIsActive(true);
  };

  if (!isOpen) return null;

  const currentMessages = activeTab === "ai" ? aiMessages : supportMessages;
  const isSending = activeTab === "ai" ? aiLoading : supportSending;

  const handleSendMessage = () => {
    if (activeTab === "ai") {
      onSendAiMessage(inputDraft);
    } else {
      onSendSupportMessage(inputDraft);
    }
    if (onInputDraftChange) {
      onInputDraftChange("");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Khung trò chuyện trực tuyến"
      ref={panelRef}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onPointerDown={handlePointerDownInside}
      data-chat-panel
      data-active={isActive ? "true" : "false"}
      className={`fixed inset-0 z-50 flex flex-col bg-background md:inset-auto md:bottom-6 md:right-[94px] md:h-[560px] md:w-[380px] md:max-w-[calc(100vw-94px-1rem)] md:max-h-[min(560px,calc(100dvh-6rem-env(safe-area-inset-bottom,0px)))] border font-sans rounded-none overflow-hidden box-border max-w-full transition-[border-color,box-shadow,ring-color] duration-200 ease-out motion-reduce:transition-none ${
        isActive
          ? "border-foreground ring-1 ring-foreground/40 shadow-2xl md:shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
          : "border-border shadow-xl md:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
      }`}
    >
      {/* Top 2px active accent line */}
      <div
        className={`h-[2px] w-full transition-[background-color] duration-200 ease-out motion-reduce:transition-none ${
          isActive ? "bg-foreground" : "bg-transparent"
        }`}
        aria-hidden="true"
      />

      {/* Header Bar */}
      <div
        data-chat-header
        data-active={isActive ? "true" : "false"}
        className={`flex h-14 shrink-0 items-center justify-between border-b px-4 transition-[background-color,color,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none ${
          isActive
            ? "bg-foreground text-background border-foreground shadow-xs"
            : "bg-card text-card-foreground border-border"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-condensed text-base font-bold uppercase tracking-wider truncate">
            {siteName} ATELIER
          </span>

          {/* Active status indicator */}
          {isActive ? (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider bg-background/15 border border-current/25 shrink-0"
              aria-label="Đang hoạt động"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đang hoạt động</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0"
              aria-label="Trực tuyến"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
              <span>Trực tuyến</span>
            </span>
          )}

          {/* Realtime indicator (Support tab only) */}
          {activeTab === "support" && isAuthenticated && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium ml-1 shrink-0 opacity-80"
              title={
                supportSocketStatus === "connected"
                  ? "Đã kết nối máy chủ realtime"
                  : supportSocketStatus === "reconnecting"
                  ? "Đang kết nối lại..."
                  : "Mất kết nối realtime"
              }
            >
              {supportSocketStatus === "connected" ? (
                <Wifi className="h-3 w-3 text-emerald-400" />
              ) : (
                <WifiOff className="h-3 w-3 text-muted-foreground" />
              )}
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {activeTab === "ai" && aiMessages.length > 0 && (
            <button
              type="button"
              onClick={onClearAiHistory}
              title="Xóa hội thoại"
              aria-label="Xóa hội thoại"
              className={`p-2 transition-colors rounded-none focus-visible:outline-none focus-visible:ring-2 ${
                isActive
                  ? "text-background/80 hover:text-background focus-visible:ring-background"
                  : "text-muted-foreground hover:text-foreground focus-visible:ring-foreground"
              }`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            data-chat-close-btn
            aria-label="Đóng cửa sổ trò chuyện"
            className={`p-2 transition-colors rounded-none focus-visible:outline-none focus-visible:ring-2 ${
              isActive
                ? "text-background/80 hover:text-background focus-visible:ring-background"
                : "text-muted-foreground hover:text-foreground focus-visible:ring-foreground"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <ChatTabs
        activeTab={activeTab}
        onTabChange={onTabChange}
        unreadCount={unreadSupportCount}
      />

      {/* Messages Scroll Area */}
      <MessageList
        activeTab={activeTab}
        messages={currentMessages}
        loading={isSending}
        isAuthenticated={isAuthenticated}
        user={user}
        siteName={siteName}
        context={context}
        onClearContext={onClearContext}
        quickSuggestions={quickSuggestions}
        onSelectSuggestion={(sug) => {
          if (onInputDraftChange) onInputDraftChange("");
          onSendAiMessage(sug);
        }}
        onLoginRedirect={onLoginRedirect}
        onActionConfirm={onActionConfirm}
        onActionCancel={onActionCancel}
        onRetry={activeTab === "support" ? onRetrySupport : onRetryAi}
        onAskProductDetails={onAskProductDetails}
      />

      {/* Chat Input */}
      {!(activeTab === "support" && !isAuthenticated) && (
        <ChatInput
          ref={inputRef}
          value={inputDraft}
          onChange={onInputDraftChange}
          onSend={handleSendMessage}
          disabled={isSending}
          placeholder={
            activeTab === "ai"
              ? "Hỏi AI Stylist về kích cỡ, phối đồ..."
              : "Nhập tin nhắn gửi nhân viên hỗ trợ..."
          }
        />
      )}
    </div>
  );
};

export default ChatPanel;
