import React, { useRef, useEffect, forwardRef } from "react";
import { Send, CornerDownLeft } from "lucide-react";

export const ChatInput = forwardRef(
  (
    {
      value,
      onChange,
      onSend,
      placeholder = "Nhập tin nhắn...",
      disabled = false,
      maxLength = 1000,
    },
    ref
  ) => {
    const internalRef = useRef(null);
    const textareaRef = ref || internalRef;

    // Auto-resize textarea height
    useEffect(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = "auto";
        const newHeight = Math.min(el.scrollHeight, 120);
        el.style.height = `${Math.max(40, newHeight)}px`;
      }
    }, [value, textareaRef]);

    const handleKeyDown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && !disabled) {
          onSend();
        }
      }
    };

    const isExceeded = value.length > maxLength;

    return (
      <div className="shrink-0 border-t border-border bg-card p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim() && !disabled && !isExceeded) {
              onSend();
            }
          }}
          className="flex items-end gap-2"
        >
          <div className="relative flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength + 10}
              className="block w-full resize-none border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground disabled:opacity-50"
            />
            {value.length > maxLength * 0.8 && (
              <span
                className={`absolute right-2 bottom-1.5 text-[9px] tabular-nums ${
                  isExceeded ? "text-destructive font-bold" : "text-muted-foreground"
                }`}
              >
                {value.length}/{maxLength}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!value.trim() || disabled || isExceeded}
            aria-label="Gửi tin nhắn"
            className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
          <span className="hidden sm:inline">Nhấn Enter để gửi, Shift+Enter để xuống dòng</span>
        </div>
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";
export default ChatInput;
