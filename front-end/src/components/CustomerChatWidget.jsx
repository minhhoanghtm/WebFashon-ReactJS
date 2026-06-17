import React, { useMemo, useRef, useState } from "react";
import { Headphones, MessageCircle, Send, X } from "lucide-react";
import { Bot, UsersRound } from 'lucide-react';
const initialMessages = [
  {
    id: 1,
    from: "support",
    text: "Xin chào! 404Studio có thể hỗ trợ bạn tìm sản phẩm, kiểm tra đơn hàng hoặc tư vấn size.",
  },
];

const CustomerChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const inputRef = useRef(null);

  const supportStatus = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 8 && hour < 22 ? "Đang trực tuyến" : "Sẽ phản hồi sớm";
  }, []);

  const openChat = () => {
    setIsOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    const nextUserMessage = {
      id: Date.now(),
      from: "user",
      text: trimmedMessage,
    };

    const supportReply = {
      id: Date.now() + 1,
      from: "support",
      text: "Cảm ơn bạn đã nhắn tin. Admin hỗ trợ của 404Studio sẽ kiểm tra và phản hồi bạn trong ít phút nữa.",
    };

    setMessages((current) => [...current, nextUserMessage, supportReply]);
    setMessage("");
  };

  return (
    <div className="fixed bottom-5 right-6 z-[70] flex flex-col-reverse items-end gap-3 sm:flex-row sm:items-end">
      {isOpen && (
        <section
          className="w-[min(calc(100vw-2rem),380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
          aria-label="Hỗ trợ khách hàng"
        >
          <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white dark:bg-slate-900">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500">
                <Headphones size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">Trò chuyện với 404Studio</h2>
                <p className="text-xs text-slate-300">{supportStatus}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Đóng chat"
              title="Đóng chat"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="flex max-h-[360px] min-h-[280px] flex-col gap-3 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-slate-900/70">
            <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs text-slate-500 dark:border-slate-800">
              <button className="flex items-center gap-1 px-2 py-1 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"> <Bot size={16} /> AI</button>
              <button className="flex items-center gap-1 px-2 py-1 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"> <UsersRound size={12} /> Admin hỗ trợ</button>
            </div>
            {messages.map((item) => {
              const isUser = item.from === "user";
              return (
                <div
                  key={item.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <p
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? "rounded-br-md bg-indigo-600 text-white"
                        : "rounded-bl-md bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
          >
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Nhập tin nhắn..."
              className="h-11 min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-indigo-950"
            />
            <button
              type="submit"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!message.trim()}
              aria-label="Gửi tin nhắn"
              title="Gửi tin nhắn"
            >
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={isOpen ? () => setIsOpen(false) : openChat}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-950"
        aria-label={isOpen ? "Đóng chat" : "Mở chat"}
        title={isOpen ? "Đóng chat" : "Mở chat"}
      >
        {isOpen ? <X size={24} aria-hidden="true" /> : <MessageCircle size={25} aria-hidden="true" />}
        {!isOpen && (
          <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
        )}
      </button>
    </div>
  );
};

export default CustomerChatWidget;
