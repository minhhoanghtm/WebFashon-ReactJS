import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Headphones,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  closeAdminConversationService,
  getAdminConversationsService,
  getAdminMessagesService,
  sendAdminMessageService,
} from "@/services/chat.service";
import useWebsiteSettings from "@/hooks/useWebsiteSettings";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const formatTime = (value) => {
  if (!value) return "--";

  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRelativeTime = (value) => {
  if (!value) return "Vừa xong";

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(Math.floor(diff / 60000), 0);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  return new Date(value).toLocaleDateString("vi-VN");
};

const getConversationTitle = (conversation) => {
  return (
    conversation?.title ||
    conversation?.user?.fullName ||
    conversation?.user?.email ||
    `Khách hàng #${String(conversation?._id || "").slice(-6).toUpperCase()}`
  );
};

const getCustomerSubtitle = (conversation) => {
  return conversation?.user?.email || `ID Khách: #${String(conversation?._id || "").slice(-5).toUpperCase()}`;
};

const getConversationPreview = (conversation) => {
  return conversation?.lastMessage || "Chưa có tin nhắn";
};

const getRoleLabel = (role) => {
  const labels = {
    user: "Khách hàng",
    admin: "Admin hỗ trợ",
    assistant: "AI tự động",
  };

  return labels[role] || role;
};

const ChatManagement = () => {
   const { settings } = useWebsiteSettings();
    const general = settings?.general || {};
    const siteName = general.siteName || "";
    useDocumentTitle("Quản lý chat");
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [reply, setReply] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const filteredConversations = useMemo(() => {
    const keyword = searchInput.trim().toLowerCase();
    if (!keyword) return conversations;

    return conversations.filter((conversation) => {
      const haystack = [
        getConversationTitle(conversation),
        conversation?.user?.email,
        conversation?.lastMessage,
        conversation?.type,
        conversation?.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [conversations, searchInput]);

  const scrollToBottom = () => {
    window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
  };

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const data = await getAdminConversationsService({
        limit: 50,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      const items = data?.items || [];

      setConversations(items);
      setSelectedConversation((current) => {
        if (current) return items.find((item) => item._id === current._id) || items[0] || null;
        return items[0] || null;
      });
    } catch (err) {
      console.error("Fetch conversations error:", err);
      toast.error("Không thể tải danh sách hội thoại.");
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    if (!conversationId) return;

    try {
      setLoadingMessages(true);
      const data = await getAdminMessagesService(conversationId, { limit: 100 });
      setMessages(data?.items || []);
      scrollToBottom();
    } catch (err) {
      console.error("Fetch messages error:", err);
      toast.error("Không thể tải tin nhắn.");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedConversation?._id) {
      fetchMessages(selectedConversation._id);
    } else {
      setMessages([]);
    }
  }, [selectedConversation?._id]);

  const handleSendReply = async (event) => {
    event.preventDefault();

    const content = reply.trim();
    if (!content || !selectedConversation?._id) return;

    try {
      setSending(true);
      const message = await sendAdminMessageService({
        conversation: selectedConversation._id,
        role: "admin",
        content,
      });

      const lastMessageAt = new Date().toISOString();

      setMessages((current) => [...current, message]);
      setReply("");
      setConversations((current) =>
        current.map((conversation) =>
          conversation._id === selectedConversation._id
            ? { ...conversation, lastMessage: content, lastMessageAt }
            : conversation
        )
      );
      setSelectedConversation((current) =>
        current ? { ...current, lastMessage: content, lastMessageAt } : current
      );
      scrollToBottom();
    } catch (err) {
      console.error("Send message error:", err);
      toast.error("Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation?._id) return;

    try {
      const updated = await closeAdminConversationService(selectedConversation._id);
      setSelectedConversation(updated);
      setConversations((current) =>
        current.map((conversation) => (conversation._id === updated._id ? updated : conversation))
      );
      toast.success("Đã đóng hội thoại.");
    } catch (err) {
      console.error("Close conversation error:", err);
      toast.error("Không thể đóng hội thoại.");
    }
  };

  const selectedTitle = selectedConversation ? getConversationTitle(selectedConversation) : "Chọn khách hàng";

  return (
    <div className="-m-8 flex h-[calc(100vh-4rem)] min-h-[680px] overflow-hidden bg-[#071027] text-white">
      <section className="flex w-full min-w-0 flex-col border-l border-[#24365f] bg-[#111b3d] lg:w-[400px] lg:shrink-0">
        <div className="border-b border-[#24365f] px-5 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300/80">
                404Studio
              </p>
              <h1 className="mt-1 text-2xl font-black text-white">Tin nhắn hỗ trợ</h1>
            </div>
            <button
              type="button"
              onClick={fetchConversations}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-400/25 bg-white/5 text-blue-200 transition hover:bg-white/10"
              aria-label="Làm mới hội thoại"
              title="Làm mới"
            >
              <RefreshCw size={16} className={loadingConversations ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="relative mt-5">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-200/60"
              aria-hidden="true"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm tên khách hàng..."
              className="h-11 w-full rounded-lg border border-blue-300/20 bg-[#172449] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-blue-100/55 focus:border-blue-400/70 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { key: "active", label: "Đang mở" },
              { key: "closed", label: "Đã đóng" },
              { key: "all", label: "Tất cả" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setStatusFilter(item.key);
                  setSelectedConversation(null);
                }}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                  statusFilter === item.key
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-white/5 text-blue-100/70 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm font-semibold text-blue-100/70">
              <RefreshCw size={16} className="animate-spin" aria-hidden="true" />
              Đang tải hội thoại...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center text-sm text-blue-100/65">
              <MessageCircle size={34} aria-hidden="true" />
              <p>Chưa có hội thoại phù hợp.</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const active = selectedConversation?._id === conversation._id;
              const isAi = conversation.type === "ai";

              return (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => setSelectedConversation(conversation)}
                  className={`group w-full border-b border-[#24365f]/70 px-5 py-4 text-left transition ${
                    active ? "bg-[#1d2a58]" : "bg-transparent hover:bg-[#172449]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-violet-500 ring-2 ring-blue-300/20">
                      {conversation?.user?.avatar_url ? (
                        <img
                          src={conversation.user.avatar_url}
                          alt={getConversationTitle(conversation)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-black text-white">
                          {getConversationTitle(conversation).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="truncate text-sm font-black text-white">
                          {getConversationTitle(conversation)}
                        </h2>
                        <span className="shrink-0 text-xs text-blue-100/50">
                          {formatRelativeTime(conversation.lastMessageAt || conversation.updatedAt)}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-blue-100/75">
                        {getConversationPreview(conversation)}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-bold ${
                            isAi
                              ? "border-violet-400/30 bg-violet-500/15 text-violet-200"
                              : "border-blue-400/30 bg-blue-500/15 text-blue-200"
                          }`}
                        >
                          {isAi ? <Bot size={12} /> : <Headphones size={12} />}
                          {isAi ? "Khách chat với AI" : "Đã tiếp quản"}
                        </span>
                        {active && <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="hidden min-w-0 flex-1 flex-col bg-[#080f28] lg:flex">
        {selectedConversation ? (
          <>
            <header className="flex h-[92px] items-center justify-between border-b border-[#24365f] bg-[#111b3d] px-5">
              <div className="flex min-w-0 items-center gap-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-violet-500 ring-2 ring-blue-300/30">
                  {selectedConversation?.user?.avatar_url ? (
                    <img
                      src={selectedConversation.user.avatar_url}
                      alt={selectedTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-black text-white">
                      {selectedTitle.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black text-white">{selectedTitle}</h2>
                  <p className="mt-0.5 truncate text-xs font-semibold text-blue-100/65">
                    {getCustomerSubtitle(selectedConversation)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseConversation}
                disabled={selectedConversation.status === "closed"}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-black text-blue-200 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShieldCheck size={15} aria-hidden="true" />
                {selectedConversation.status === "closed" ? "Đã đóng" : "Admin kiểm soát"}
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm font-semibold text-blue-100/70">
                  <RefreshCw size={16} className="animate-spin" aria-hidden="true" />
                  Đang tải tin nhắn...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-blue-100/60">
                  <MessageCircle size={36} aria-hidden="true" />
                  <p className="text-sm">Hội thoại này chưa có tin nhắn.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((item) => {
                    const isCustomer = item.role === "user";
                    const isAi = item.role === "assistant";

                    return (
                      <div
                        key={item._id}
                        className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
                      >
                        <div className={`max-w-[66%] ${isCustomer ? "text-left" : "text-right"}`}>
                          {!isCustomer && (
                            <div className="mb-2 flex justify-end">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-bold ${
                                  isAi ? "text-fuchsia-300" : "text-blue-300"
                                }`}
                              >
                                {isAi ? <Bot size={13} /> : <ShieldCheck size={13} />}
                                {getRoleLabel(item.role)}
                              </span>
                            </div>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-7 shadow-lg ${
                              isCustomer
                                ? "rounded-bl-md bg-[#1d2a58] text-white"
                                : isAi
                                  ? "rounded-br-md border border-fuchsia-500/30 bg-[#2a0b55] text-white"
                                  : "rounded-br-md bg-blue-600 text-white"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{item.content}</p>
                          </div>
                          <p
                            className={`mt-1 text-xs ${
                              isCustomer ? "text-blue-100/45" : "text-blue-100/55"
                            }`}
                          >
                            {formatTime(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form
              onSubmit={handleSendReply}
              className="flex items-center gap-4 border-t border-[#24365f] bg-[#111b3d] px-5 py-5"
            >
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                rows={1}
                disabled={selectedConversation.status === "closed"}
                placeholder={
                  selectedConversation.status === "closed"
                    ? "Hội thoại đã đóng"
                    : "Nhập phản hồi từ admin..."
                }
                className="min-h-12 flex-1 resize-none rounded-xl border border-blue-300/20 bg-[#1b2853] px-5 py-3 text-sm text-white outline-none transition placeholder:text-blue-100/45 focus:border-blue-400/70 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending || !reply.trim() || selectedConversation.status === "closed"}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Gửi phản hồi"
                title="Gửi phản hồi"
              >
                {sending ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-blue-100/60">
            <UserRound size={42} aria-hidden="true" />
            <p className="text-sm font-semibold">Chọn một hội thoại để bắt đầu hỗ trợ.</p>
          </div>
        )}
      </section>

      <section className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#080f28] p-8 text-center text-blue-100/70 lg:hidden">
        <MessageCircle size={38} aria-hidden="true" />
        <p className="text-sm font-semibold">Chọn một hội thoại ở danh sách để xem và trả lời tin nhắn.</p>
      </section>
    </div>
  );
};

export default ChatManagement;
