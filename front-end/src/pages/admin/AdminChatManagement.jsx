import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronLeft,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import {
  assignAdminConversationService,
  closeAdminConversationService,
  getAdminConversationsService,
  getAdminMessagesService,
  reopenAdminConversationService,
  sendAdminMessageService,
} from '@/services/chat.service';
import { ENV } from '@/config/env';
import { tokenStorage } from '@/utils/token';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  AdminPageHeader,
  AdminCard,
  AdminBadge,
  AdminEmptyState,
} from '@/components/admin/ui';

const statusMeta = {
  waiting_admin: { label: 'Chờ phản hồi', variant: 'warning' },
  waiting_customer: { label: 'Chờ khách', variant: 'info' },
  open: { label: 'Đang mở', variant: 'success' },
  closed: { label: 'Đã đóng', variant: 'neutral' },
};

const formatTime = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
};

const getCustomerName = (conversation) => {
  const customer = conversation?.customerId;
  return customer?.fullName || customer?.name || customer?.email || 'Khách vãng lai';
};

const AdminChatManagement = () => {
  useDocumentTitle('Chat hỗ trợ — 404Studio Admin');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Mobile conversation view toggle
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const selectedConversationRef = useRef(null);

  const socketUrl = useMemo(() => {
    return ENV.API_BASE_URL.replace('/api', '');
  }, []);

  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesStatus =
        activeFilter === 'all' || conversation.status === activeFilter;
      const customerName = getCustomerName(conversation).toLowerCase();
      const customerEmail = String(
        conversation.customerId?.email || ''
      ).toLowerCase();
      const matchesSearch =
        !keyword ||
        customerName.includes(keyword) ||
        customerEmail.includes(keyword);
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
      { total: 0, waiting_admin: 0, waiting_customer: 0, open: 0, closed: 0 }
    );
  }, [conversations]);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await getAdminConversationsService({
        limit: 100,
        type: 'support',
      });
      const items = res?.items || [];
      setConversations(items);
      setSelectedConversation((current) => {
        if (!current) return items[0] || null;
        return items.find((item) => item._id === current._id) || items[0] || null;
      });
    } catch (error) {
      console.error('Fetch admin conversations error:', error);
      toast.error('Không thể tải danh sách hội thoại hỗ trợ');
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
      console.error('Fetch admin messages error:', error);
      toast.error('Không thể tải nội dung hội thoại');
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
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation?._id) {
      loadMessages(selectedConversation._id);
    } else {
      setMessages([]);
    }
  }, [selectedConversation?._id]);

  // Socket Connection
  useEffect(() => {
    const token = tokenStorage.getToken();
    if (!token) return undefined;

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('message:new', ({ message, conversation }) => {
      if (conversation?._id) {
        setConversations((prev) => {
          const index = prev.findIndex((item) => item._id === conversation._id);
          if (index === -1) return [conversation, ...prev];
          const next = [...prev];
          next[index] = { ...next[index], ...conversation };
          return next;
        });
      }

      if (selectedConversationRef.current?._id === message?.conversationId) {
        appendMessage(message);
      }
    });

    socket.on('conversation:status_changed', (updated) => {
      if (!updated?._id) return;
      setConversations((prev) =>
        prev.map((item) => (item._id === updated._id ? { ...item, ...updated } : item))
      );
      if (selectedConversationRef.current?._id === updated._id) {
        setSelectedConversation((current) =>
          current ? { ...current, ...updated } : current
        );
      }
    });

    return () => {
      if (socket.connected) {
        socket.disconnect();
      } else {
        socket.once('connect', () => {
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

    socket.emit('conversation:join', conversationId);
    return () => {
      socket.emit('conversation:leave', conversationId);
    };
  }, [selectedConversation?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedConversation?._id]);

  const updateSelectedConversation = (updated) => {
    if (!updated?._id) return;
    setSelectedConversation(updated);
    setConversations((prev) =>
      prev.map((item) => (item._id === updated._id ? updated : item))
    );
  };

  const handleAssign = async () => {
    if (!selectedConversation?._id) return;
    try {
      const updated = await assignAdminConversationService(
        selectedConversation._id
      );
      updateSelectedConversation(updated);
      toast.success('Đã tiếp nhận phiên tư vấn');
    } catch {
      toast.error('Không thể tiếp nhận hội thoại');
    }
  };

  const handleClose = async () => {
    if (!selectedConversation?._id) return;
    try {
      const updated = await closeAdminConversationService(
        selectedConversation._id
      );
      updateSelectedConversation(updated);
      toast.success('Đã hoàn tất và đóng phiên chat');
    } catch {
      toast.error('Không thể đóng hội thoại');
    }
  };

  const handleReopen = async () => {
    if (!selectedConversation?._id) return;
    try {
      const updated = await reopenAdminConversationService(
        selectedConversation._id
      );
      updateSelectedConversation(updated);
      toast.success('Đã mở lại phiên chat');
    } catch {
      toast.error('Không thể mở lại hội thoại');
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (
      !content ||
      !selectedConversation?._id ||
      selectedConversation.status === 'closed'
    )
      return;

    try {
      setSending(true);
      setDraft('');
      const res = await sendAdminMessageService({
        conversationId: selectedConversation._id,
        content,
      });
      if (res?.message) {
        appendMessage(res.message);
      }
      await loadConversations();
    } catch {
      toast.error('Không thể gửi tin nhắn');
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <AdminPageHeader
        title="Trung tâm hỗ trợ khách hàng"
        description="Phản hồi thắc mắc, tư vấn chọn size và giải quyết khiếu nại qua kênh chat trực tuyến"
        breadcrumbs={[{ label: 'Chat CSKH' }]}
        actions={
          <button
            onClick={loadConversations}
            aria-label="Làm mới cuộc trò chuyện"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Tổng hội thoại</span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
            {stats.total}
          </span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl flex items-center justify-between">
          <span className="text-xs text-amber-600 font-medium">Chờ phản hồi</span>
          <span className="text-base font-extrabold text-amber-600 tabular-nums">
            {stats.waiting_admin}
          </span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl flex items-center justify-between">
          <span className="text-xs text-emerald-600 font-medium">Đang mở</span>
          <span className="text-base font-extrabold text-emerald-600 tabular-nums">
            {stats.open}
          </span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Đã đóng</span>
          <span className="text-base font-extrabold text-slate-500 tabular-nums">
            {stats.closed}
          </span>
        </div>
      </div>

      {/* Main Two-Column Chat Workspace */}
      <AdminCard noPadding className="h-[700px] flex overflow-hidden">
        {/* Left Column: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200/80 dark:border-slate-800 flex flex-col shrink-0 bg-white dark:bg-slate-900 ${
            mobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search & Filter */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm khách hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30"
              />
            </div>

            <div className="flex gap-1">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'waiting_admin', label: 'Cần trả lời' },
                { id: 'open', label: 'Đang mở' },
                { id: 'closed', label: 'Đã đóng' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                    activeFilter === f.id
                      ? 'bg-[#05251C]/10 text-[#05251C] dark:bg-[#F5DD20]/15 dark:text-[#F5DD20]'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 scrollbar-thin">
            {loadingConversations ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Đang tải hội thoại...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Không tìm thấy hội thoại nào
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversation?._id === conv._id;
                const name = getCustomerName(conv);
                const initial = name.charAt(0).toUpperCase();
                const statusInfo = statusMeta[conv.status] || statusMeta.open;

                return (
                  <button
                    key={conv._id}
                    type="button"
                    onClick={() => {
                      setSelectedConversation(conv);
                      setMobileChatOpen(true);
                    }}
                    className={`w-full p-3.5 flex items-start gap-3 text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#05251C]/10 dark:bg-[#F5DD20]/15 border-l-4 border-[#05251C] dark:border-[#F5DD20]'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold shrink-0">
                      {initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatTime(conv.updatedAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {conv.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                      </p>

                      <div className="mt-1.5 flex items-center justify-between">
                        <AdminBadge variant={statusInfo.variant} dot size="sm">
                          {statusInfo.label}
                        </AdminBadge>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Stream & Actions */}
        <div
          className={`flex-1 flex flex-col bg-slate-50/40 dark:bg-slate-950/40 ${
            !mobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setMobileChatOpen(false)}
                    className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {getCustomerName(selectedConversation)}
                    </h3>
                    <div className="text-[11px] text-slate-400">
                      {selectedConversation.customerId?.email || 'Khách hàng'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedConversation.status === 'waiting_admin' && (
                    <button
                      onClick={handleAssign}
                      className="px-3 py-1.5 bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white text-xs font-semibold rounded-xl shadow-xs transition"
                    >
                      Tiếp nhận
                    </button>
                  )}
                  {selectedConversation.status !== 'closed' ? (
                    <button
                      onClick={handleClose}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-xl transition"
                    >
                      Đóng phiên
                    </button>
                  ) : (
                    <button
                      onClick={handleReopen}
                      className="px-3 py-1.5 border border-[#05251C] text-[#05251C] dark:border-[#F5DD20] dark:text-[#F5DD20] hover:bg-[#05251C]/10 text-xs font-semibold rounded-xl transition"
                    >
                      Mở lại
                    </button>
                  )}
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Đang nạp tin nhắn...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Chưa có tin nhắn nào trong hội thoại này
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin =
                      msg.senderType === 'admin' || msg.senderType === 'staff';

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${
                          isAdmin ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-md rounded-2xl p-3 text-xs leading-relaxed ${
                            isAdmin
                              ? 'bg-[#05251C] dark:bg-[#F5DD20] text-white dark:text-[#05251C] rounded-br-xs shadow-xs font-medium'
                              : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-xs shadow-2xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={handleSend}
                className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={
                    selectedConversation.status === 'closed'
                      ? 'Phiên chat đã đóng. Hãy mở lại để tiếp tục nhắn.'
                      : 'Nhập nội dung tư vấn phản hồi khách hàng...'
                  }
                  disabled={selectedConversation.status === 'closed' || sending}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 h-10 px-3.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={
                    !draft.trim() ||
                    selectedConversation.status === 'closed' ||
                    sending
                  }
                  aria-label="Gửi tin nhắn"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] disabled:opacity-50 text-white transition shadow-xs cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <AdminEmptyState
              icon={MessageCircle}
              title="Chọn hội thoại"
              description="Chọn một cuộc trò chuyện từ danh sách bên trái để phản hồi khách hàng."
            />
          )}
        </div>
      </AdminCard>
    </div>
  );
};

export default AdminChatManagement;
