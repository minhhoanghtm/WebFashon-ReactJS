import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  AlertCircle,
  Sparkles,
  UserCheck,
  Headset,
  ExternalLink,
  Star,
} from "lucide-react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/auth.store";
import { tokenStorage } from "../utils/token";
import { ENV } from "../config/env";
import {
  getCustomerConversationsService,
  getCustomerMessagesService,
  sendCustomerAiMessageService,
  sendCustomerSupportMessageService,
} from "../services/chat.service";
import { toast } from "react-toastify";
import { useChatContextStore } from "@/store/chatContext.store";
import Markdown from "./Markdown";

const parseInlineProducts = (content) => {
  if (typeof content !== "string") return { cleanedContent: "", items: [] };

  const items = [];
  let cleanedContent = content;

  const regex = /(?:[*+-]|\d+\.)\s+\*\*(.*?)\*\*[\s*]*[*+-]?\s*(?:Giá|Gia|Price):\s*([^*+-|\d.]+)(?:[\s*]*[*+-]?\s*(?:Link ảnh|Link anh|Image|Link):\s*(https?:\/\/\S+))?(?:\s*[*+-]?\s*(?:ID sản phẩm|ID san pham|ID):\s*`?([a-f0-9]+)`?)?/gi;

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

const CustomerChatWidget = () => {
  // const [isOpen, setIsOpen] = useState(false);
  const { isOpen, openChat, closeChat, context } = useChatContextStore();
  const [chatMode, setChatMode] = useState("ai"); // 'ai' or 'support'
  const [messageText, setMessageText] = useState("");
  const [conversations, setConversations] = useState({
    ai: null,
    support: null,
  });
  const { isAuthenticated, user } = useAuthStore();
  const userKey = user?._id || user?.id || "guest";
  const AI_CHAT_STORAGE_KEY = `customer_ai_chat_history_${userKey}`;
  const AI_CHAT_METADATA_KEY = `customer_ai_chat_metadata_${userKey}`;

  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = localStorage.getItem(`customer_ai_chat_history_${userKey}`);
      return {
        ai: savedMessages ? JSON.parse(savedMessages) || [] : [],
        support: [],
      };
    } catch {
      return { ai: [], support: [] };
    }
  });

  const [aiMetadata, setAiMetadata] = useState(() => {
    try {
      const savedMetadata = localStorage.getItem(`customer_ai_chat_metadata_${userKey}`);
      return savedMetadata ? JSON.parse(savedMetadata) || { lastIntent: null, lastProductId: null } : { lastIntent: null, lastProductId: null };
    } catch {
      return { lastIntent: null, lastProductId: null };
    }
  });

  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isLoadedRef = useRef(false);
  const prevUserRef = useRef(user);
  const lastKeyRef = useRef(AI_CHAT_STORAGE_KEY);

  if (lastKeyRef.current !== AI_CHAT_STORAGE_KEY) {
    isLoadedRef.current = false;
    lastKeyRef.current = AI_CHAT_STORAGE_KEY;
  }

  const socketUrl = useMemo(() => {
    return ENV.API_BASE_URL.replace("/api", "");
  }, []);

  // const productMessage = {
  //   _id: `product_${context?.productid}_${Date.now()}`,
  //   senderType: "system",
  //   messageType: "product",
  //   product: {
  //     ...context,
  //   },
  //   createdAt: new Date().toISOString(),
  // };
  // Fetch active conversations
  const fetchConversations = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getCustomerConversationsService();
      const items = res?.items || [];

      const activeAi = items.find(
        (c) => c.type === "ai" && c.status !== "closed",
      );
      const activeSupport = items.find(
        (c) => c.type === "support" && c.status !== "closed",
      );

      setConversations({
        ai: activeAi || null,
        support: activeSupport || null,
      });

      if (activeAi) {
        const aiMsgRes = await getCustomerMessagesService(activeAi._id);
        setMessages((prev) => ({
          ...prev,
          ai: aiMsgRes?.items?.reverse() || [],
        }));
      }

      if (activeSupport) {
        const supMsgRes = await getCustomerMessagesService(activeSupport._id);
        setMessages((prev) => ({
          ...prev,
          support: supMsgRes?.items?.reverse() || [],
        }));
      }
    } catch (error) {
      console.error("Lỗi khi nạp hội thoại:", error);
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, chatMode]);

  // Handle socket connections
  useEffect(() => {
    if (!isAuthenticated || !isOpen) return;

    const token = tokenStorage.getToken();

    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("message:new", (message) => {
      console.log("New message:", message);

      const conversationId = String(
        message?.conversationId?._id || message?.conversationId || "",
      );

      if (conversationId === conversations.support?._id) {
        setMessages((prev) => {
          const exists = prev.support.some((m) => m._id === message._id);

          if (exists) return prev;

          return {
            ...prev,
            support: [...prev.support, message],
          };
        });
      }
    });

    socket.on("typing:start", () => {
      setIsTyping(true);
    });

    socket.on("typing:stop", () => {
      setIsTyping(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, isOpen, conversations.support?._id]);

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket) return;

    if (conversations.support?._id) {
      console.log("Joining room:", conversations.support._id);

      socket.emit("conversation:join", conversations.support._id);
    }
  }, [conversations.support?._id]);

  useEffect(() => {
    if (!isOpen) return;

    console.log("Chat context updated:", context);
  }, [isOpen, context]);

  // Load AI chat history from localStorage
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(AI_CHAT_STORAGE_KEY);
      setMessages((prev) => ({
        ...prev,
        ai: savedMessages ? JSON.parse(savedMessages) || [] : [],
      }));
    } catch (error) {
      console.error("Lỗi khi tải lịch sử chat AI:", error);
    } finally {
      isLoadedRef.current = true;
    }
  }, [AI_CHAT_STORAGE_KEY]);

  // Load AI chat metadata from localStorage
  useEffect(() => {
    try {
      const savedMetadata = localStorage.getItem(AI_CHAT_METADATA_KEY);
      setAiMetadata(
        savedMetadata
          ? JSON.parse(savedMetadata) || { lastIntent: null, lastProductId: null }
          : { lastIntent: null, lastProductId: null }
      );
    } catch (error) {
      console.error("Lỗi khi tải metadata chat AI:", error);
    }
  }, [AI_CHAT_METADATA_KEY]);

  const updateAiMetadata = (newMeta) => {
    setAiMetadata(newMeta);
    try {
      localStorage.setItem(AI_CHAT_METADATA_KEY, JSON.stringify(newMeta));
    } catch (error) {
      console.error("Lỗi khi lưu metadata chat AI:", error);
    }
  };

  // Auto-save AI chat history to localStorage whenever messages.ai changes
  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      const currentSaved = localStorage.getItem(AI_CHAT_STORAGE_KEY);
      if ((!messages.ai || messages.ai.length === 0) && currentSaved && JSON.parse(currentSaved).length > 0) {
        return;
      }

      localStorage.setItem(
        AI_CHAT_STORAGE_KEY,
        JSON.stringify(messages.ai || []),
      );
    } catch (error) {
      console.error("Lỗi khi lưu lịch sử chat AI:", error);
    }
  }, [messages.ai, AI_CHAT_STORAGE_KEY]);

  // Delete localStorage AI chat history only when user explicitly logs out
  useEffect(() => {
    if (prevUserRef.current && !user) {
      const prevKey = `customer_ai_chat_history_${
        prevUserRef.current.id || prevUserRef.current._id || "guest"
      }`;
      localStorage.removeItem(prevKey);

      const prevMetaKey = `customer_ai_chat_metadata_${
        prevUserRef.current.id || prevUserRef.current._id || "guest"
      }`;
      localStorage.removeItem(prevMetaKey);

      setMessages((prev) => ({
        ...prev,
        ai: [],
      }));
      setConversations((prev) => ({
        ...prev,
        ai: null,
      }));
      setAiMetadata({ lastIntent: null, lastProductId: null });
      isLoadedRef.current = false;
    }
    prevUserRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;

    if (!context?.type || context.type !== "product") return;

    // Update lastProductId in metadata when viewing product
    setAiMetadata((prev) => {
      const nextMeta = { ...prev, lastProductId: context.productid };
      try {
        localStorage.setItem(AI_CHAT_METADATA_KEY, JSON.stringify(nextMeta));
      } catch (err) {
        console.error(err);
      }
      return nextMeta;
    });

    setMessages((prev) => {
      const lastProduct = [...prev.ai]
        .reverse()
        .find((m) => m.messageType === "product");

      // Tránh thêm lại cùng 1 sản phẩm
      if (lastProduct?.product?.productid === context.productid) {
        return prev;
      }

      return {
        ...prev,
        ai: [
          ...prev.ai,
          {
            _id: `product_${context.productid}_${Date.now()}`,
            senderType: "system",
            messageType: "product",
            product: { ...context },
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
  }, [context, isOpen, AI_CHAT_METADATA_KEY]);

  // Handle typing status notification
  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    const activeConv =
      chatMode === "ai" ? conversations.ai : conversations.support;
    if (socketRef.current && activeConv?._id) {
      if (e.target.value.trim() !== "") {
        socketRef.current.emit("typing:start", {
          conversationId: activeConv._id,
        });
      } else {
        socketRef.current.emit("typing:stop", {
          conversationId: activeConv._id,
        });
      }
    }
  };

  const sendMessageDirectly = async (text, customMetadata = null) => {
    if (!text.trim()) return;

    setLoading(true);

    const activeConv =
      chatMode === "ai" ? conversations.ai : conversations.support;
    if (socketRef.current && activeConv?._id) {
      socketRef.current.emit("typing:stop", { conversationId: activeConv._id });
    }

    try {
      if (chatMode === "ai") {
        // Optimistic UI update
        const tempUserMsg = {
          _id: Date.now().toString(),
          senderType: "user",
          content: text,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => ({ ...prev, ai: [...prev.ai, tempUserMsg] }));

        const metaToSend = customMetadata || aiMetadata;

        const res = await sendCustomerAiMessageService({
          content: text,
          conversationId: activeConv?._id || undefined,
          history: !isAuthenticated ? messages.ai : undefined,
          currentProductId: context?.productid || undefined,
          metadata: metaToSend,
        });

        // Set or update active AI conversation
        if (!conversations.ai && res?.conversationId) {
          setConversations((prev) => ({
            ...prev,
            ai: { _id: res.conversationId, type: "ai" },
          }));
        }

        // Save returned metadata if available
        if (res?.metadata) {
          updateAiMetadata(res.metadata);
        }

        // Check if handoff was triggered
        if (res?.handoff) {
          toast.success(
            "Đã tự động chuyển đổi sang kênh hỗ trợ của Nhân viên!",
          );
          setChatMode("support");
          await fetchConversations();
        } else if (res?.aiMessage) {
          // If no handoff, append the actual messages returned
          setMessages((prev) => {
            const filtered = prev.ai.filter((m) => m._id !== tempUserMsg._id);
            return {
              ...prev,
              ai: [...filtered, res.userMessage || tempUserMsg, res.aiMessage],
            };
          });
        }
      } else {
        // Send support message
        const tempUserMsg = {
          _id: Date.now().toString(),
          senderType: "user",
          content: text,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => ({
          ...prev,
          support: [...prev.support, tempUserMsg],
        }));

        const res = await sendCustomerSupportMessageService({
          content: text,
          conversationId: activeConv?._id || undefined,
        });

        if (!conversations.support && res?.conversationId) {
          setConversations((prev) => ({
            ...prev,
            support: { _id: res.conversationId, type: "support" },
          }));
        }

        setMessages((prev) => {
          const filtered = prev.support.filter(
            (m) => m._id !== tempUserMsg._id,
          );
          return {
            ...prev,
            support: [...filtered, res.message],
          };
        });
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      toast.error(error.response?.data?.message || "Không thể gửi tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text) return;

    setMessageText("");
    await sendMessageDirectly(text);
  };

  const activeMessages = chatMode === "ai" ? messages.ai : messages.support;

  return (
    <div className="fixed bottom-5 right-6 z-[70] flex flex-col-reverse items-end gap-3 sm:flex-row sm:items-end font-sans">
      {/* CHAT MODAL */}
      {isOpen && (
        <div className="w-[min(calc(100vw-2rem),400px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 transition-all duration-350 transform animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex flex-col bg-slate-900 px-4 py-3 text-white dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 shadow-md">
                  <Headset size={18} className="text-white" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold tracking-tight">
                    404Studio Support
                  </h2>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Hỗ trợ trực tuyến 24/7
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeChat}
                className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Đóng chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode selection tabs */}
            <div className="flex bg-slate-800 dark:bg-slate-900 rounded-xl p-1 mt-3 gap-1">
              <button
                type="button"
                onClick={() => setChatMode("ai")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  chatMode === "ai"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Bot size={14} />
                <span>Trợ lý AI</span>
              </button>
              <button
                type="button"
                onClick={() => setChatMode("support")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  chatMode === "support"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <User size={14} />
                <span>Chat với nhân viên</span>
              </button>
            </div>
          </div>

          {/* Chat content container */}
          <div className="flex flex-col h-[380px] bg-slate-50 dark:bg-slate-900/60">
            {chatMode === "support" && !isAuthenticated ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-500">
                  <AlertCircle size={26} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Đăng nhập để nhận hỗ trợ
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[260px] leading-relaxed">
                    Bạn cần đăng nhập để trò chuyện với đội ngũ chăm sóc khách
                    hàng của chúng tôi.
                  </p>
                </div>
                <a
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/15 transition duration-150"
                >
                  Đăng nhập ngay
                </a>
              </div>
            ) : (
              <>
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {/* 1. Card product (rendered at the absolute top if user is viewing a product) */}

                  {/* 2. Welcome message (AI or Support) below the product card */}
                  {chatMode === "ai" ? (
                    <div className="flex gap-2 text-left animate-in fade-in-50 duration-200">
                      <span className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Bot size={14} />
                      </span>
                      <div className="max-w-[80%] space-y-1">
                        <p className="rounded-2xl rounded-tl-none bg-white dark:bg-slate-800 text-xs px-3.5 py-2.5 shadow-sm text-slate-700 dark:text-slate-200 leading-relaxed border border-slate-100 dark:border-slate-850">
                          Xin chào {user?.fullName || "bạn"}! 👋 Mình là trợ lý
                          AI của 404Studio. Chúng tôi có thể giúp được gì cho
                          bạn?
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 text-left animate-in fade-in-50 duration-200">
                      <span className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                        <User size={14} />
                      </span>
                      <div className="max-w-[80%] space-y-1">
                        <p className="rounded-2xl rounded-tl-none bg-white dark:bg-slate-800 text-xs px-3.5 py-2.5 shadow-sm text-slate-700 dark:text-slate-200 leading-relaxed border border-slate-100 dark:border-slate-850">
                          Xin chào {user?.fullName || "bạn"}! 👋 Mình là nhân
                          viên hỗ trợ của 404Studio. Bạn có thể hỏi về sản phẩm,
                          đơn hàng, thanh toán hoặc các vấn đề liên quan đến
                          dịch vụ của chúng tôi. Mình sẽ phản hồi trong giây
                          lát!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 3. Active messages mapping  */}
                  {activeMessages.map((msg) => {
                    if (msg.messageType === "product") {
                      return (
                        <div key={msg._id} className="flex justify-end">
                          <div className="w-[200px] bg-white dark:bg-slate-800 rounded-2xl rounded-tr-none border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <img
                              src={msg.product.image}
                              alt={msg.product.productName}
                              className="w-full h-28 object-cover"
                            />

                            <div className="p-3">
                              <span className="text-[10px] uppercase tracking-wider text-indigo-500">
                                Sản phẩm đang xem
                              </span>

                              <h4 className="mt-1 text-sm font-semibold">
                                {msg.product.productName}
                              </h4>

                              <div className="mt-2 text-lg font-bold text-indigo-600">
                                {Number(
                                  msg.product.new_price ||
                                    msg.product.price ||
                                    0,
                                ).toLocaleString("vi-VN")}
                                đ
                              </div>

                              <a
                                href={`/product/${msg.product.slug}`}
                                className="mt-3 inline-flex items-center gap-1"
                              >
                                <ExternalLink size={13} />
                                Xem chi tiết
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const isUser = msg.senderType === "user";
                    const isSystem = msg.senderType === "system";
                    const isAi = msg.senderType === "ai";

                    const renderChatMessageContent = (m) => {
                      if (m.senderType === "system") {
                        return (
                          <span className="text-[10px] font-semibold tracking-wider text-slate-400 bg-slate-200/50 dark:bg-slate-850 px-2.5 py-1 rounded-full uppercase">
                            {m.content}
                          </span>
                        );
                      }

                      if (m.senderType === "user") {
                        return <span>{m.content}</span>;
                      }

                      // Parse inline products from AI message
                      const { cleanedContent, items } = parseInlineProducts(m.content);

                      if (items.length > 0) {
                        return (
                          <div className="space-y-3">
                            {cleanedContent && <Markdown>{cleanedContent}</Markdown>}
                            <div className="grid grid-cols-1 gap-2.5 mt-2">
                              {items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-xs hover:border-indigo-500 transition-colors duration-200"
                                >
                                  {item.image && (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-16 h-16 object-cover rounded-lg shrink-0 border border-slate-200 dark:border-slate-700"
                                    />
                                  )}
                                  <div className="flex-1 flex flex-col justify-between min-w-0">
                                    <div>
                                      <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-[11px] line-clamp-2 leading-snug text-left">
                                        {item.name}
                                      </h4>
                                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1 text-left">
                                        {item.price}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const targetMeta = item.id
                                          ? { ...aiMetadata, lastProductId: item.id }
                                          : aiMetadata;
                                        sendMessageDirectly("chi tiết", targetMeta);
                                      }}
                                      className="mt-2 py-1 px-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white font-medium text-[9px] rounded-md transition-colors self-start duration-150 cursor-pointer"
                                    >
                                      Xem chi tiết
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      return <Markdown>{m.content}</Markdown>;
                    };

                    if (isSystem) {
                      return (
                        <div
                          key={msg._id}
                          className="flex justify-center my-1.5"
                        >
                          {renderChatMessageContent(msg)}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={msg._id}
                        className={`flex gap-2 ${
                          isUser
                            ? "justify-end text-right"
                            : "justify-start text-left"
                        }`}
                      >
                        {!isUser && (
                          <span
                            className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                              isAi
                                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {isAi ? <Bot size={14} /> : <User size={14} />}
                          </span>
                        )}
                        <div className="max-w-[76%] space-y-1">
                          <div
                            className={`text-xs px-3.5 py-2.5 shadow-sm leading-relaxed border ${
                              isUser
                                ? "rounded-2xl rounded-tr-none bg-indigo-600 border-indigo-650 text-white text-left"
                                : "rounded-2xl rounded-tl-none bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-850 text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {renderChatMessageContent(msg)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex gap-2 text-left animate-pulse">
                      <span className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center text-slate-500 shrink-0">
                        <User size={14} />
                      </span>
                      <div className="max-w-[80%]">
                        <div className="rounded-2xl rounded-tl-none bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-850 text-xs px-3.5 py-2.5 shadow-sm text-slate-400 italic">
                          Nhân viên hỗ trợ đang nhập...
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Footer/Form input */}
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
                >
                  <input
                    type="text"
                    value={messageText}
                    onChange={handleInputChange}
                    placeholder={
                      chatMode === "ai"
                        ? "Nhập tin nhắn để AI tư vấn..."
                        : "Nhập tin nhắn gửi Admin..."
                    }
                    className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-indigo-950"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!messageText.trim() || loading}
                    aria-label="Gửi tin nhắn"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      <button
        type="button"
        onClick={() => (isOpen ? closeChat() : openChat())}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-650/25 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-950 cursor-pointer"
        aria-label={isOpen ? "Đóng chat" : "Mở chat"}
        title={isOpen ? "Đóng chat" : "Mở chat"}
      >
        {isOpen ? (
          <X size={24} className="transition transform duration-200 rotate-0" />
        ) : (
          <MessageCircle
            size={25}
            className="transition transform duration-200 scale-100"
          />
        )}
        {!isOpen && (
          <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
        )}
      </button>
    </div>
  );
};

export default CustomerChatWidget;
