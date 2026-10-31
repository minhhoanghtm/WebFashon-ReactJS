import React from "react";
import { Sparkles, Headphones } from "lucide-react";

export const ChatTabs = ({ activeTab, onTabChange, unreadCount = 0 }) => {
  return (
    <div
      role="tablist"
      aria-label="Kênh trò chuyện"
      className="grid w-full grid-cols-2 border-b border-border bg-muted/30 p-1 text-xs"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "ai"}
        id="chat-tab-ai"
        aria-controls="chat-panel-ai"
        onClick={() => onTabChange("ai")}
        className={`flex items-center justify-center gap-2 py-2 font-medium tracking-wide transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground ${
          activeTab === "ai"
            ? "bg-background text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>AI Stylist</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "support"}
        id="chat-tab-support"
        aria-controls="chat-panel-support"
        onClick={() => onTabChange("support")}
        className={`relative flex items-center justify-center gap-2 py-2 font-medium tracking-wide transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground ${
          activeTab === "support"
            ? "bg-background text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Headphones className="h-3.5 w-3.5" />
        <span>Nhân viên</span>
        {unreadCount > 0 && (
          <span className="flex h-4 min-w-[16px] items-center justify-center bg-destructive px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatTabs;
