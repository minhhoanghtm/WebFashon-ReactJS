import React from "react";
import { Sparkles, Headphones } from "lucide-react";

export const ChatTabs = ({ activeTab, onTabChange, unreadCount = 0 }) => {
  return (
    <div
      role="tablist"
      aria-label="Kênh trò chuyện"
      className="grid w-full grid-cols-2 border-b border-border bg-muted/30 text-xs"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "ai"}
        id="chat-tab-ai"
        aria-controls="chat-panel-ai"
        onClick={() => onTabChange("ai")}
        className={`relative flex items-center justify-center gap-2 py-2.5 font-medium tracking-wide transition-all rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground ${
          activeTab === "ai"
            ? "bg-background text-foreground font-semibold border-b-2 border-foreground shadow-2xs"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border-b-2 border-transparent"
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
        className={`relative flex items-center justify-center gap-2 py-2.5 font-medium tracking-wide transition-all rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground ${
          activeTab === "support"
            ? "bg-background text-foreground font-semibold border-b-2 border-foreground shadow-2xs"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border-b-2 border-transparent"
        }`}
      >
        <Headphones className="h-3.5 w-3.5" />
        <span>Nhân viên</span>
        {unreadCount > 0 && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-none bg-destructive px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatTabs;
