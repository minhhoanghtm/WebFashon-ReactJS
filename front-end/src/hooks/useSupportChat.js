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
  const isTabActiveRef = useRef(isOpen && isSupportTabActive);

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
        const msgs = (msgRes?.items || []).slice().reverse();
        setMessages(msgs);
      } else {
        setConversation(null);
        convIdRef.current = null;
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

    socket.on("message:new", (newMsg) => {
      if (!newMsg) return;
      const targetConvId = String(
        newMsg?.conversationId?._id || newMsg?.conversationId || ""
      );

      // Verify conversation matches or adopt if we didn't have one yet
      if (!convIdRef.current && targetConvId) {
        convIdRef.current = targetConvId;
      }

      if (convIdRef.current && targetConvId && targetConvId !== convIdRef.current) {
        return;
      }

      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });

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
  }, [isAuthenticated, socketUrl]);

  // Join/leave conversation room when conversation changes
  useEffect(() => {
    const socket = socketRef.current;
    const cid = conversation?._id;
    convIdRef.current = cid || null;

    if (!socket || !cid || !socket.connected) return;

    socket.emit("conversation:join", cid);

    return () => {
      socket.emit("conversation:leave", cid);
    };
  }, [conversation?._id]);

  // Send message
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || "").trim();
      if (!trimmed || !isAuthenticated) return;

      setSending(true);

      const tempMsg = {
        _id: `temp_${Date.now()}`,
        senderType: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMsg]);

      try {
        const payload = {
          content: trimmed,
          conversationId: convIdRef.current || undefined,
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
          setMessages((prev) => {
            const filtered = prev.filter((m) => m._id !== tempMsg._id);
            return [...filtered, res.message];
          });
        }
      } catch (err) {
        console.error("Lỗi gửi tin nhắn hỗ trợ:", err);
        setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
        toast.error(
          err?.response?.data?.message || "Không thể gửi tin nhắn hỗ trợ."
        );
      } finally {
        setSending(false);
      }
    },
    [isAuthenticated, conversation]
  );

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
    loadSupportData,
    clearUnread,
  };
};
