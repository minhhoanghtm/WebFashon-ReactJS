import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Headphones,
  Inbox,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  UserCheck,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import {
  assignAdminConversationService,
  closeAdminConversationService,
  getAdminConversationsService,
  getAdminMessagesService,
  reopenAdminConversationService,
  sendAdminMessageService,
} from "@/services/chat.service";
import { ENV } from "@/config/env";
import { tokenStorage } from "@/utils/token";
import useWebsiteSettings from "@/hooks/useWebsiteSettings";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const statusMeta = {
  waiting_admin: {
    label: "Chờ trả lời",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900",
  },
  waiting_customer: {
    label: "Chờ khách",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900",
  },
  open: {
    label: "Đang mở",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900",
  },
  closed: {
    label: "Đã đóng",
    className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
};

const filters = [
  { key: "all", label: "Tổng hội thoại" },
  { key: "waiting_admin", label: "Chờ trả lời" },
];

const formatTime = (value) => {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
};

const getCustomerName = (conversation) => {
  const customer = conversation?.customerId;
  return customer?.fullName || customer?.email || "Khách hàng";
};

const getInitial = (conversation) => {
  return getCustomerName(conversation).charAt(0).toUpperCase();
};

const AdminChatManagement = () => {
   const { settings } = useWebsiteSettings();
    const general = settings?.general || {};
    const siteName = general.siteName || "";
    useDocumentTitle(`Quản lý chat`);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const selectedConversationRef = useRef(null);

  const socketUrl = useMemo(() => {
    return ENV.API_BASE_URL.replace("/api", "");
  }, []);

  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesStatus = activeFilter === "all" || conversation.status === activeFilter;
      const customerName = getCustomerName(conversation).toLowerCase();
      const customerEmail = String(conversation.customerId?.email || "").toLowerCase();
      const matchesSearch = !keyword || customerName.includes(keyword) || customerEmail.includes(keyword);
      return matchesStatus && matchesSearch;
    });
  }, [activeFilter, conversations, search]);

  const stats = useMemo(() => {
    return conversations.reduce(
      (acc, conversation) => {
        acc.total += 1;
        acc[conversation.status] = (acc[conversation.status] || 0) + 1;
        return acc;
      },
      { total: 0 }
    );
  }, [conversations]);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await getAdminConversationsService({ limit: 100, type: "support" });
      const items = res?.items || [];
      setConversations(items);
      setSelectedConversation((current) => {
        if (!current) return items[0] || null;
        return items.find((item) => item._id === current._id) || items[0] || null;
      });
    } catch (error) {
      console.error("Fetch admin conversations error:", error);
      toast.error("Không thể tải danh sách hội thoại hỗ trợ");
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId) => {
    if (!conversationId) return;
    try {
      setLoadingMessages(true);
      const res = await getAdminMessagesService(conversationId, { limit: 100 });
      setMessages(res?.items || []);
    } catch (error) {
      console.error("Fetch admin messages error:", error);
      toast.error("Không thể tải nội dung hội thoại");
    } finally {
      setLoadingMessages(false);
    }
  };

  const appendMessage = (message) => {
    if (!message?._id) return;
    setMessages((prev) => {
      if (prev.some((item) => item._id === message._id)) return prev;
      return [...prev, message];
    });
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation?._id) {
      loadMessages(selectedConversation._id);
    } else {
      setMessages([]);
    }
  }, [selectedConversation?._id]);

  useEffect(() => {
    const token = tokenStorage.getToken();
    if (!token) return undefined;

    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (selectedConversationRef.current?._id) {
        socket.emit("conversation:join", selectedConversationRef.current._id);
      }
    });

    socket.on("message:new", (message) => {
      const conversationId = String(message?.conversationId || "");
      const currentId = String(selectedConversationRef.current?._id || "");

      loadConversations();
      if (conversationId && conversationId === currentId) {
        appendMessage(message);
      }
    });

    return () => {
      if (socket.connected) {
        socket.disconnect();
      } else {
        socket.once("connect", () => {
          socket.disconnect();
        });
      }
      socketRef.current = null;
    };
  }, [socketUrl]);

  useEffect(() => {
    const socket = socketRef.current;
    const conversationId = selectedConversation?._id;
    if (!socket || !conversationId) return undefined;

    socket.emit("conversation:join", conversationId);
    return () => {
      socket.emit("conversation:leave", conversationId);
    };
  }, [selectedConversation?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversation?._id]);

  const updateSelectedConversation = (updated) => {
    if (!updated?._id) return;
    setSelectedConversation(updated);
    setConversations((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
  };

  const handleAssign = async () => {
    if (!selectedConversation?._id) return;
    try {
      const updated = await assignAdminConversationService(selectedConversation._id);
      updateSelectedConversation(updated);
      toast.success("Đã nhận xử lý hội thoại");
    } catch (error) {
      console.error("Assign conversation error:", error);
      toast.error("Không thể nhận xử lý hội thoại");
    }
  };

  const handleClose = async () => {
    if (!selectedConversation?._id) return;
    try {
      const updated = await closeAdminConversationService(selectedConversation._id);
      updateSelectedConversation(updated);
      toast.success("Đã đóng hội thoại");
    } catch (error) {
      console.error("Close conversation error:", error);
      toast.error("Không thể đóng hội thoại");
    }
  };

  const handleReopen = async () => {
    if (!selectedConversation?._id) return;
    try {
      const updated = await reopenAdminConversationService(selectedConversation._id);
      updateSelectedConversation(updated);
      toast.success("Đã mở lại hội thoại");
    } catch (error) {
      console.error("Reopen conversation error:", error);
      toast.error("Không thể mở lại hội thoại");
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !selectedConversation?._id || selectedConversation.status === "closed") return;

    try {
      setSending(true);
      setDraft("");
      const res = await sendAdminMessageService({
        conversationId: selectedConversation._id,
        content,
      });
      if (res?.message) {
        appendMessage(res.message);
      }
      await loadConversations();
    } catch (error) {
      console.error("Send admin message error:", error);
      toast.error("Không thể gửi tin nhắn");
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  const selectedStatus = statusMeta[selectedConversation?.status] || statusMeta.open;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Headphones className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                Chat hỗ trợ
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Theo dõi và phản hồi hội thoại hỗ trợ khách hàng
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={loadConversations}
          disabled={loadingConversations}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${loadingConversations ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <p className="text-xs font-bold uppercase text-slate-400">Tổng hội thoại</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <p className="text-xs font-bold uppercase text-slate-400">Chờ trả lời</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">{stats.waiting_admin || 0}</p>
        </div>
      </section>

      <section className="grid min-h-[650px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="flex min-h-[650px] flex-col border-b border-slate-200 dark:border-slate-800 xl:border-b-0 xl:border-r">
          <div className="space-y-4 border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-950"
                placeholder="Tìm khách hàng..."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    activeFilter === filter.key
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingConversations && conversations.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
                Đang tải hội thoại...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-slate-400">
                <Inbox className="h-9 w-9" />
                <p className="text-sm font-semibold">Không có hội thoại phù hợp</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const meta = statusMeta[conversation.status] || statusMeta.open;
                const active = selectedConversation?._id === conversation._id;
                return (
                  <button
                    key={conversation._id}
                    type="button"
                    onClick={() => setSelectedConversation(conversation)}
                    className={`flex w-full gap-3 border-b border-slate-100 p-4 text-left transition dark:border-slate-800 ${
                      active ? "bg-indigo-50 dark:bg-indigo-950/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-extrabold text-white dark:bg-slate-700">
                      {getInitial(conversation)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                          {getCustomerName(conversation)}
                        </span>
                        <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                          {formatTime(conversation.lastMessageAt || conversation.updatedAt)}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                        {conversation.customerId?.email || "Chưa có email"}
                      </span>
                      <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${meta.className}`}>
                        {meta.label}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className="flex min-h-[650px] min-w-0 flex-col">
          {selectedConversation ? (
            <>
              <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-base font-extrabold text-white">
                    {getInitial(selectedConversation)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-extrabold text-slate-950 dark:text-white">
                      {getCustomerName(selectedConversation)}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{selectedConversation.customerId?.email || "Chưa có email"}</span>
                      <span className={`rounded-full border px-2 py-0.5 ${selectedStatus.className}`}>
                        {selectedStatus.label}
                      </span>
                    </div>
                  </div>
                </div>


              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-5 dark:bg-slate-950/40">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
                    Đang tải tin nhắn...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-400">
                    <MessageCircle className="h-10 w-10" />
                    <p className="text-sm font-semibold">Chưa có tin nhắn trong hội thoại này</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isAdmin = message.senderType === "admin";
                      const isSystem = message.senderType === "system";
                      if (isSystem) {
                        return (
                          <div key={message._id} className="flex justify-center">
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {message.content}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div key={message._id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[78%] space-y-1 flex flex-col ${isAdmin ? "items-end text-right" : "items-start text-left"}`}>
                            {message.messageType === "product" || message.metadata?.type === "product" ? (
                              (() => {
                                const productInfo = message.product || message.metadata?.product;
                                if (!productInfo) return null;
                                return (
                                  <div className="w-[200px] bg-white dark:bg-slate-800 rounded-2xl rounded-tl-md rounded-bl-md border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm text-left">
                                    <img
                                      src={productInfo.image}
                                      alt={productInfo.productName}
                                      className="w-full h-28 object-cover"
                                    />
                                    <div className="p-3">
                                      <span className="text-[10px] uppercase tracking-wider text-indigo-500 font-semibold">
                                        Sản phẩm đang xem
                                      </span>
                                      <h4 className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        {productInfo.productName}
                                      </h4>
                                      <div className="mt-2 text-sm font-bold text-indigo-600">
                                        {Number(
                                          productInfo.new_price ||
                                            productInfo.price ||
                                            0,
                                        ).toLocaleString("vi-VN")}
                                        đ
                                      </div>
                                      <a
                                        href={`/product/${productInfo.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline"
                                      >
                                        <ExternalLink size={12} />
                                        Xem chi tiết
                                      </a>
                                    </div>
                                  </div>
                                );
                              })()
                            ) : (
                              <p
                                className={`rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed shadow-sm ${
                                  isAdmin
                                    ? "rounded-br-md bg-indigo-600 text-white"
                                    : "rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                }`}
                              >
                                {message.content}
                              </p>
                            )}
                            <span className="block text-[11px] font-semibold text-slate-400">
                              {isAdmin ? "Admin" : message.senderType === "ai" ? "AI" : "Khách"} • {formatTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
                {selectedConversation.status === "closed" ? (
                  <div className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <AlertCircle className="h-4 w-4" />
                    Hội thoại đã đóng
                  </div>
                ) : (
                  <>
                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-950"
                      placeholder="Nhập phản hồi cho khách hàng..."
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim() || sending}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Gửi tin nhắn"
                    >
                      {sending ? <Clock3 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </button>
                  </>
                )}
              </form>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-slate-400">
              <Inbox className="h-12 w-12" />
              <h2 className="text-lg font-extrabold text-slate-600 dark:text-slate-300">Chưa chọn hội thoại</h2>
              <p className="max-w-sm text-sm font-medium">
                Chọn một hội thoại ở danh sách bên trái để xem nội dung và phản hồi khách hàng.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminChatManagement;
