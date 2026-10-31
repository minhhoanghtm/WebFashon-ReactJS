import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageCircle,
  RefreshCw,
  Search,
  Send,
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

const formatMessageDay = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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

  const messagesListRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);
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
    shouldStickToBottomRef.current = true;
  }, [selectedConversation?._id]);

  useEffect(() => {
    if (!shouldStickToBottomRef.current || !messagesListRef.current) return;
    messagesListRef.current.scrollTo({
      top: messagesListRef.current.scrollHeight,
      behavior: 'smooth',
    });
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
    <div className="space-y-4 text-left lg:flex lg:h-full lg:min-h-[520px] lg:flex-col">
      {/* Header */}
      <AdminPageHeader
        title="Trung tâm hỗ trợ khách hàng"
        description="Phản hồi thắc mắc, tư vấn chọn size và giải quyết khiếu nại qua kênh chat trực tuyến"
        breadcrumbs={[{ label: 'Chat CSKH' }]}
        actions={
          <button
            onClick={loadConversations}
            aria-label="Làm mới cuộc trò chuyện"
            className="flex h-10 w-10 items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)]"
            title="Làm mới danh sách"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />

      {/* Stats Counter Bar */}
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="flex items-center justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">Tổng hội thoại</span>
          <span className="text-base font-bold tabular-nums text-[var(--color-text)]">
            {stats.total}
          </span>
        </div>
        <div className="flex items-center justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">Chờ phản hồi</span>
          <span className="text-base font-bold tabular-nums text-[var(--color-text)]">
            {stats.waiting_admin}
          </span>
        </div>
        <div className="flex items-center justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">Đang mở</span>
          <span className="text-base font-bold tabular-nums text-[var(--color-text)]">
            {stats.open}
          </span>
        </div>
        <div className="flex items-center justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">Đã đóng</span>
          <span className="text-base font-bold tabular-nums text-[var(--color-text)]">
            {stats.closed}
          </span>
        </div>
      </div>

      {/* Main Two-Column Chat Workspace */}
      <AdminCard noPadding className="min-h-[520px] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <div className="flex h-[calc(100dvh-17rem)] min-h-[520px] lg:min-h-0 lg:flex-1">
        {/* Left Column: Conversations List */}
        <div
          className={`flex min-h-0 w-full flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:w-[23rem] lg:shrink-0 ${
            mobileChatOpen ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search & Filter */}
          <div className="shrink-0 space-y-3 border-b border-[var(--color-border)] p-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Tìm khách hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full border border-[var(--color-border)] bg-[var(--color-bg)] pl-9 pr-3 text-xs text-[var(--color-text)] outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'waiting_admin', label: 'Cần trả lời' },
                { id: 'open', label: 'Đang mở' },
                { id: 'closed', label: 'Đã đóng' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`min-h-9 border px-1 py-1 text-[10px] font-semibold tracking-wide uppercase transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)] ${
                    activeFilter === f.id
                      ? 'border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div role="listbox" aria-label="Danh sách hội thoại hỗ trợ" className="min-h-0 flex-1 divide-y divide-[var(--color-border)] overflow-y-auto overscroll-contain">
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
                      requestAnimationFrame(() => {
                        document.activeElement?.scrollIntoView({ block: 'nearest' });
                      });
                    }}
                    role="option"
                    aria-selected={isSelected}
                    className={`flex min-h-[76px] w-full items-start gap-3 border-l-4 p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-text)] ${
                      isSelected
                        ? 'border-l-[var(--color-text)] bg-[var(--color-bg)]'
                        : 'border-l-transparent hover:bg-[var(--color-bg)]'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-xs font-bold text-[var(--color-text)]">
                      {initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="truncate text-xs font-bold text-[var(--color-text)]">
                          {name}
                        </span>
                        <span className="ml-2 shrink-0 text-[10px] text-[var(--color-text-muted)]">
                          {formatTime(conv.updatedAt)}
                        </span>
                      </div>

                      <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                        {conv.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                      </p>

                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <AdminBadge variant={statusInfo.variant} dot size="sm">
                          {statusInfo.label}
                        </AdminBadge>
                        {Number(conv.unreadByAdmin || conv.unreadCount || 0) > 0 && (
                          <span className="min-w-5 bg-[var(--color-text)] px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums text-[var(--color-bg)]">
                            {conv.unreadByAdmin || conv.unreadCount}
                          </span>
                        )}
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
          className={`min-h-0 min-w-0 flex-1 flex-col bg-[var(--color-bg)] ${
            !mobileChatOpen ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setMobileChatOpen(false)}
                    aria-label="Quay lại danh sách hội thoại"
                    className="flex h-11 w-11 items-center justify-center border border-[var(--color-border)] text-[var(--color-text)] lg:hidden"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-xs font-bold text-[var(--color-text)]">
                    {getCustomerName(selectedConversation).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-xs font-bold text-[var(--color-text)]">
                      {getCustomerName(selectedConversation)}
                    </h3>
                    <div className="truncate text-[11px] text-[var(--color-text-muted)]">
                      {selectedConversation.customerId?.email || 'Khách hàng'}
                    </div>
                    <div className="mt-1"><AdminBadge variant={(statusMeta[selectedConversation.status] || statusMeta.open).variant} size="sm">{(statusMeta[selectedConversation.status] || statusMeta.open).label}</AdminBadge></div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedConversation.status === 'waiting_admin' && (
                    <button
                      onClick={handleAssign}
                      className="min-h-11 border border-[var(--color-text)] bg-[var(--color-text)] px-3 text-xs font-semibold text-[var(--color-bg)] transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)]"
                    >
                      Tiếp nhận
                    </button>
                  )}
                  {selectedConversation.status !== 'closed' ? (
                    <button
                      onClick={handleClose}
                      className="min-h-11 border border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)]"
                    >
                      Đóng phiên
                    </button>
                  ) : (
                    <button
                      onClick={handleReopen}
                      className="min-h-11 border border-[var(--color-text)] px-3 text-xs font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)]"
                    >
                      Mở lại
                    </button>
                  )}
                </div>
              </div>

              {/* Message Stream */}
              <div
                ref={messagesListRef}
                aria-live="polite"
                aria-label="Nội dung hội thoại"
                onScroll={() => {
                  const element = messagesListRef.current;
                  if (!element) return;
                  shouldStickToBottomRef.current =
                    element.scrollHeight - element.scrollTop - element.clientHeight < 96;
                }}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
              >
                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Đang nạp tin nhắn...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Chưa có tin nhắn nào trong hội thoại này
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isAdmin =
                      msg.senderType === 'admin' || msg.senderType === 'staff';
                    const previousMessage = messages[index - 1];
                    const showDayDivider =
                      !previousMessage ||
                      formatMessageDay(previousMessage.createdAt) !==
                        formatMessageDay(msg.createdAt);

                    return (
                      <React.Fragment key={msg._id}>
                        {showDayDivider && (
                          <div className="flex items-center gap-3 py-2" aria-label={formatMessageDay(msg.createdAt)}>
                            <span className="h-px flex-1 bg-[var(--color-border)]" />
                            <span className="text-[10px] font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
                              {formatMessageDay(msg.createdAt)}
                            </span>
                            <span className="h-px flex-1 bg-[var(--color-border)]" />
                          </div>
                        )}
                        <div
                          className={`flex flex-col ${
                            isAdmin ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] border p-3 text-xs leading-relaxed ${
                              isAdmin
                                ? 'border-[var(--color-text)] bg-[var(--color-text)] font-medium text-[var(--color-bg)]'
                                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="mt-1 px-1 text-[10px] text-[var(--color-text-muted)]">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={handleSend}
                className="flex shrink-0 items-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3"
              >
                {selectedConversation.status === 'closed' && (
                  <p className="hidden text-xs text-[var(--color-text-muted)] sm:block">
                    Phiên chat đã đóng. Mở lại phiên để tiếp tục phản hồi.
                  </p>
                )}
                <textarea
                  rows={1}
                  placeholder={
                    selectedConversation.status === 'closed'
                      ? 'Phiên chat đã đóng. Hãy mở lại để tiếp tục nhắn.'
                      : 'Nhập nội dung tư vấn phản hồi khách hàng...'
                  }
                  disabled={selectedConversation.status === 'closed' || sending}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSend(event);
                    }
                  }}
                  className="[field-sizing:content] max-h-[104px] min-h-11 flex-1 resize-none border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 text-xs leading-5 text-[var(--color-text)] outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={
                    !draft.trim() ||
                    selectedConversation.status === 'closed' ||
                    sending
                  }
                  aria-label="Gửi tin nhắn"
                  className="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)]"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <AdminEmptyState icon={MessageCircle} title="Chọn một hội thoại để bắt đầu" description="Chọn một cuộc trò chuyện từ danh sách để xem và phản hồi khách hàng." />
          )}
        </div>
        </div>
      </AdminCard>
    </div>
  );
};

export default AdminChatManagement;
