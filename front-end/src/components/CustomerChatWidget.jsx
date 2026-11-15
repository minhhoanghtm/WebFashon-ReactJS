import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChatContextStore } from "@/store/chatContext.store";
import { useAuthStore } from "@/store/auth.store";
import useWebsiteSettings from "@/hooks/useWebsiteSettings";
import trackingService from "@/services/tracking.service";

import ChatLauncher from "./chat/ChatLauncher";
import ChatPanel from "./chat/ChatPanel";
import { useAiChat } from "@/hooks/useAiChat";
import { useSupportChat } from "@/hooks/useSupportChat";

export const CustomerChatWidget = () => {
  const { isOpen, openChat, closeChat, context, clearContext } =
    useChatContextStore();
  const { isAuthenticated, user } = useAuthStore();
  const { settings } = useWebsiteSettings();
  const location = useLocation();
  const navigate = useNavigate();

  const siteName = settings?.general?.siteName || "404STUDIO";
  const launcherRef = useRef(null);

  // Track previous route key (pathname + search). Excludes hash so in-page anchor jumps don't close chat.
  const prevRouteKeyRef = useRef(`${location.pathname}${location.search}`);

  // Automatically close chat on route transition (link click, back/forward, navigate) without stealing focus
  useEffect(() => {
    const currentRouteKey = `${location.pathname}${location.search}`;
    if (prevRouteKeyRef.current !== currentRouteKey) {
      prevRouteKeyRef.current = currentRouteKey;
      if (isOpen) {
        closeChat();
      }
    }
  }, [location.pathname, location.search, isOpen, closeChat]);

  // Mode tab state: 'ai' or 'support'
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const autoOpen = sessionStorage.getItem("customer_chat_auto_open");
      if (autoOpen === "support") return "support";
    } catch (e) {
      console.error(e);
    }
    return "ai";
  });

  // Draft input state with persistence
  const [inputDraft, setInputDraft] = useState(() => {
    try {
      return sessionStorage.getItem("customer_chat_draft") || "";
    } catch {
      return "";
    }
  });

  const handleInputDraftChange = useCallback((val) => {
    setInputDraft(val);
    try {
      sessionStorage.setItem("customer_chat_draft", val);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Check auto-open from login redirect
  useEffect(() => {
    try {
      const autoOpen = sessionStorage.getItem("customer_chat_auto_open");
      if (autoOpen === "support" && isAuthenticated) {
        openChat();
        sessionStorage.removeItem("customer_chat_auto_open");
        sessionStorage.removeItem("customer_chat_draft");
        window.requestAnimationFrame(() => {
          setActiveTab("support");
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [isAuthenticated, openChat]);

  // Track chat opened
  useEffect(() => {
    if (isOpen) {
      trackingService.trackAIChatOpened?.();
    }
  }, [isOpen]);

  // Hook for AI chat
  const handleHandoff = useCallback(() => {
    setActiveTab("support");
  }, []);

  const aiChat = useAiChat({
    context,
    onHandoff: handleHandoff,
  });

  // Hook for Support chat
  const supportChat = useSupportChat({
    isOpen,
    isSupportTabActive: activeTab === "support",
    context,
  });

  // Login redirect with return path and draft preservation
  const handleLoginRedirect = () => {
    try {
      sessionStorage.setItem("customer_chat_draft", inputDraft);
      sessionStorage.setItem("customer_chat_auto_open", "support");
    } catch (e) {
      console.error(e);
    }
    const currentUrl = location.pathname + location.search;
    navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
  };

  const handleToggle = () => {
    if (isOpen) {
      closeChat();
      setTimeout(() => {
        launcherRef.current?.focus();
      }, 50);
    } else {
      openChat();
    }
  };

  const handleClose = () => {
    closeChat();
    setTimeout(() => {
      launcherRef.current?.focus();
    }, 50);
  };

  // Do not render on auth pages or admin pages
  const isAuthOrAdmin = [
    "/login",
    "/register",
    "/reset-password",
    "/verify-otp",
    "/admin",
  ].some((path) => location.pathname.startsWith(path));

  if (isAuthOrAdmin) return null;

  return (
    <>
      <ChatLauncher
        ref={launcherRef}
        isOpen={isOpen}
        onToggle={handleToggle}
        unreadCount={supportChat.unreadCount}
      />

      <ChatPanel
        isOpen={isOpen}
        onClose={handleClose}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        siteName={siteName}
        // AI
        aiMessages={aiChat.messages}
        aiLoading={aiChat.loading}
        quickSuggestions={aiChat.quickSuggestions}
        onSendAiMessage={aiChat.sendMessage}
        onClearAiHistory={aiChat.clearHistory}
        onRetryAi={aiChat.retryLastMessage}
        // Support
        supportMessages={supportChat.messages}
        supportSending={supportChat.sending}
        supportSocketStatus={supportChat.socketStatus}
        unreadSupportCount={supportChat.unreadCount}
        onSendSupportMessage={supportChat.sendMessage}
        onRetrySupport={supportChat.retryMessage}
        // Shared
        user={user}
        isAuthenticated={isAuthenticated}
        context={context}
        onClearContext={clearContext}
        inputDraft={inputDraft}
        onInputDraftChange={handleInputDraftChange}
        onLoginRedirect={handleLoginRedirect}
        onActionConfirm={(action) => {
          trackingService.trackAIChatInteraction?.("ai_cart_action_confirmed", {
            actionId: action?.actionId,
            items: action?.items,
          });
          aiChat.confirmAction(action);
        }}
        onActionCancel={(action) => {
          aiChat.cancelAction(action);
        }}
        onAskProductDetails={(item) => {
          const targetMeta = item.id
            ? { ...aiChat.aiMetadata, lastProductId: item.id }
            : aiChat.aiMetadata;
          aiChat.sendMessage(`Xem chi tiết ${item.name}`, targetMeta);
        }}
      />
    </>
  );
};

export default CustomerChatWidget;
