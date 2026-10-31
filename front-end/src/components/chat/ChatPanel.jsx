import React, { useEffect, useRef } from "react";
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

  // Autofocus input when opening dialog
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, activeTab]);

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
      className="fixed inset-0 z-50 flex flex-col bg-background sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[560px] sm:w-[380px] sm:max-h-[calc(100svh-7rem)] sm:border sm:border-border sm:shadow-2xl font-sans transition-all duration-200 animate-in fade-in zoom-in-95 motion-reduce:animate-none"
    >
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 text-card-foreground">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-condensed text-base font-bold uppercase tracking-wider text-foreground truncate">
            {siteName} ATELIER
          </span>

          {/* Connection status (Support tab only) */}
          {activeTab === "support" && isAuthenticated && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground ml-1 shrink-0"
              title={
                supportSocketStatus === "connected"
                  ? "Đã kết nối máy chủ realtime"
                  : supportSocketStatus === "reconnecting"
                  ? "Đang kết nối lại..."
                  : "Mất kết nối realtime"
              }
            >
              {supportSocketStatus === "connected" ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Trực tuyến</span>
                </>
              ) : supportSocketStatus === "reconnecting" ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-600 dark:text-amber-400">Đang kết nối lại</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  <span>Ngoại tuyến</span>
                </>
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
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng khung trò chuyện"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
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
        onRetry={onRetryAi}
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
