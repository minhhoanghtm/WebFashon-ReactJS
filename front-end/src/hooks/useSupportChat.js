import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";
import { tokenStorage } from "@/utils/token";
import { ENV } from "@/config/env";
import {
  getCustomerConversationsService,
  getCustomerMessagesService,
  sendCustomerSupportMessageService,
} from "@/services/chat.service";
import { toast } from "react-toastify";

const clientMessageIdOf = (message) =>
  message?.clientMessageId || message?.metadata?.clientMessageId || null;

export const mergeSupportMessages = (current, incoming) => {
  const next = [...current];
  for (const message of incoming.filter(Boolean)) {
    const normalized = message?._id?.startsWith?.("temp_")
      ? message
      : { ...message, isFailed: false };
    const clientMessageId = clientMessageIdOf(normalized);
    const index = next.findIndex((existing) =>
      (existing?._id && normalized?._id && String(existing._id) === String(normalized._id)) ||
      (clientMessageId && clientMessageIdOf(existing) === clientMessageId)
    );
    if (index >= 0) next[index] = { ...next[index], ...normalized };
    else next.push(normalized);
  }
  return next.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
};

const createClientMessageId = () =>
  globalThis.crypto?.randomUUID?.() || `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export const useSupportChat = ({ isOpen, isSupportTabActive } = {}) => {
  const { isAuthenticated, user } = useAuthStore();
  const userKey = user?._id || user?.id || "guest";
  const unreadStorageKey = `customer_support_unread_count_${userKey}`;

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [socketStatus, setSocketStatus] = useState("disconnected"); // 'connected' | 'reconnecting' | 'disconnected'
  const [unreadCount, setUnreadCount] = useState(() => {
    try {
      return parseInt(localStorage.getItem(unreadStorageKey) || "0", 10);
    } catch {
      return 0;
    }
  });

  const socketRef = useRef(null);
  const convIdRef = useRef(null);
  const lastMessageAtRef = useRef(null);
  const isTabActiveRef = useRef(isOpen && isSupportTabActive);

  const mergeIncomingMessages = useCallback((incoming) => {
    setMessages((previous) => {
      const merged = mergeSupportMessages(previous, Array.isArray(incoming) ? incoming : [incoming]);
      const last = merged[merged.length - 1];
      if (last?.createdAt) lastMessageAtRef.current = new Date(last.createdAt).toISOString();
      return merged;
    });
  }, []);

  const syncMissedMessages = useCallback(async () => {
    const conversationId = convIdRef.current;
    if (!conversationId) return;
    const params = { limit: 100 };
    if (lastMessageAtRef.current) params.cursor = lastMessageAtRef.current;
    const data = await getCustomerMessagesService(conversationId, params);
    mergeIncomingMessages(data?.items || []);
  }, [mergeIncomingMessages]);

  useEffect(() => {
    isTabActiveRef.current = isOpen && isSupportTabActive;
    if (isOpen && isSupportTabActive) {
      setUnreadCount(0);
      try {
        localStorage.setItem(unreadStorageKey, "0");
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen, isSupportTabActive, unreadStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(unreadStorageKey, String(unreadCount));
    } catch (e) {
      console.error(e);
    }
  }, [unreadCount, unreadStorageKey]);

  const socketUrl = useMemo(() => {
    return ENV.API_BASE_URL.replace(/\/api\/?$/, "") || "/";
  }, []);

  // Fetch active support conversation and message history
  const loadSupportData = useCallback(async () => {
    if (!isAuthenticated) {
      setConversation(null);
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const res = await getCustomerConversationsService();
      const items = res?.items || [];
      const activeSupport = items.find(
        (c) => c.type === "support" && c.status !== "closed"
      );

      if (activeSupport) {
        setConversation(activeSupport);
        convIdRef.current = activeSupport._id;
        const msgRes = await getCustomerMessagesService(activeSupport._id);
        const msgs = msgRes?.items || [];
        setMessages(msgs);
        const last = msgs[msgs.length - 1];
        lastMessageAtRef.current = last?.createdAt ? new Date(last.createdAt).toISOString() : null;
      } else {
        setConversation(null);
        convIdRef.current = null;
        lastMessageAtRef.current = null;
        setMessages([]);
      }
    } catch (err) {
      console.error("Lỗi tải hội thoại hỗ trợ:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSupportData();
    } else {
      setConversation(null);
      setMessages([]);
    }
  }, [isAuthenticated, loadSupportData]);

  // Socket Connection Management
  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketStatus("disconnected");
      return;
    }

    const token = tokenStorage.getToken();
    if (!token) return;

    setSocketStatus("reconnecting");
    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketStatus("connected");
      if (convIdRef.current) {
        socket.emit("conversation:join", convIdRef.current);
      }
      syncMissedMessages().catch((error) => console.error("Không thể đồng bộ tin nhắn bị lỡ:", error));
    });

    socket.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    socket.on("reconnecting", () => {
      setSocketStatus("reconnecting");
    });

    socket.on("reconnect_attempt", () => {
      setSocketStatus("reconnecting");
    });

    socket.on("message:new", ({ message: newMsg, conversation: incomingConversation } = {}) => {
      if (!newMsg) return;
      const targetConvId = String(
        incomingConversation?._id || newMsg?.conversationId?._id || newMsg?.conversationId || ""
      );

      // Verify conversation matches or adopt if we didn't have one yet
      if (!convIdRef.current && targetConvId) {
        convIdRef.current = targetConvId;
        if (incomingConversation?._id) setConversation(incomingConversation);
      }

      if (convIdRef.current && targetConvId && targetConvId !== convIdRef.current) {
        return;
      }

      mergeIncomingMessages(newMsg);

      // Increment unread count if message came from admin/staff and user is not looking at it
      if (newMsg.senderType === "admin" && !isTabActiveRef.current) {
        setUnreadCount((c) => c + 1);
      }
    });

    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
      socketRef.current = null;
      setSocketStatus("disconnected");
    };
  }, [isAuthenticated, mergeIncomingMessages, socketUrl, syncMissedMessages]);

  // Join/leave conversation room when conversation changes
  useEffect(() => {
    const socket = socketRef.current;
    const cid = conversation?._id;
    convIdRef.current = cid || null;

    if (!socket || !cid || !socket.connected) return;

    socket.emit("conversation:join", cid);
    syncMissedMessages().catch((error) => console.error("Không thể đồng bộ tin nhắn bị lỡ:", error));

    return () => {
      socket.emit("conversation:leave", cid);
    };
  }, [conversation?._id, syncMissedMessages]);

  // Send message
  const sendMessage = useCallback(
    async (text, retryMessage = null) => {
      const trimmed = (text || "").trim();
      if (!trimmed || !isAuthenticated) return;

      setSending(true);

      const clientMessageId = retryMessage?.clientMessageId || createClientMessageId();

      const tempMsg = {
        _id: retryMessage?._id || `temp_${clientMessageId}`,
        clientMessageId,
        senderType: "user",
        content: trimmed,
        createdAt: retryMessage?.createdAt || new Date().toISOString(),
        isFailed: false,
      };
      if (retryMessage) {
        setMessages((prev) => prev.map((message) =>
          message._id === retryMessage._id ? tempMsg : message
        ));
      } else {
        mergeIncomingMessages(tempMsg);
      }

      try {
        const payload = {
          content: trimmed,
          conversationId: convIdRef.current || undefined,
          clientMessageId,
        };

        const res = await sendCustomerSupportMessageService(payload);

        if (!conversation && res?.conversationId) {
          const newConv = { _id: res.conversationId, type: "support" };
          setConversation(newConv);
          convIdRef.current = res.conversationId;
          if (socketRef.current?.connected) {
            socketRef.current.emit("conversation:join", res.conversationId);
          }
        }

        if (res?.message) {
          mergeIncomingMessages(res.message);
        }
      } catch (err) {
        console.error("Lỗi gửi tin nhắn hỗ trợ:", err);
        setMessages((prev) => prev.map((message) =>
          message._id === tempMsg._id ? { ...message, isFailed: true } : message
        ));
        toast.error(
          err?.response?.data?.message || "Không thể gửi tin nhắn hỗ trợ."
        );
      } finally {
        setSending(false);
      }
    },
    [isAuthenticated, conversation, mergeIncomingMessages]
  );

  const retryMessage = useCallback((message) => {
    if (!message?.isFailed) return;
    return sendMessage(message.content, message);
  }, [sendMessage]);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
    try {
      localStorage.setItem(unreadStorageKey, "0");
    } catch (e) {
      console.error(e);
    }
  }, [unreadStorageKey]);

  return {
    conversation,
    messages,
    loading,
    sending,
    socketStatus,
    unreadCount,
    sendMessage,
    retryMessage,
    loadSupportData,
    clearUnread,
  };
};
