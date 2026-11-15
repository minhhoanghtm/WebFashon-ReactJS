import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Laptop, ChevronDown } from "lucide-react";
import { useThemeStore } from "../../stores/themeStore";

export function ThemeSwitcher({ className = "", compact = false }) {
  const { theme, setTheme, getResolvedTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const resolvedTheme = getResolvedTheme();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const options = [
    { id: "light", label: "Sáng (Light)", icon: Sun },
    { id: "dark", label: "Tối (Dark)", icon: Moon },
    { id: "system", label: "Hệ thống (System)", icon: Laptop },
  ];

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Chuyển giao diện: hiện đang chọn ${theme}`}
        aria-expanded={isOpen}
        title={`Chế độ giao diện: ${theme.toUpperCase()}`}
        data-testid="theme-switcher-trigger"
        className="min-h-[40px] px-2.5 bg-[#161619] hover:bg-[#202025] border border-[rgba(244,240,232,0.15)] hover:border-[#e65100] text-[#f4f0e8] text-xs font-display tracking-wider uppercase flex items-center gap-1.5 transition-all shadow-sm"
      >
        {resolvedTheme === "dark" ? (
          <Moon size={15} className="text-[#ff6d00]" />
        ) : (
          <Sun size={15} className="text-[#e65100]" />
        )}

        {!compact && (
          <>
            <span className="hidden xl:inline text-[11px] font-mono">
              {theme === "system" ? "Auto" : theme === "dark" ? "Dark" : "Light"}
            </span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full mt-1.5 w-44 bg-[#161619] border border-[rgba(244,240,232,0.15)] shadow-2xl py-1.5 z-50 animate-fade-in"
        >
          <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-[#9a989f] border-b border-white/5">
            Giao diện (Theme)
          </div>

          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                role="menuitem"
                onClick={() => {
                  setTheme(opt.id);
                  setIsOpen(false);
                }}
                data-testid={`theme-option-${opt.id}`}
                className={`w-full px-3 py-2 text-left text-xs font-display uppercase tracking-wider flex items-center justify-between transition-colors ${
                  isSelected
                    ? "bg-[#e65100] text-white font-bold"
                    : "text-[#f4f0e8] hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className={isSelected ? "text-white" : "text-[#9a989f]"} />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <span className="text-[10px] font-mono">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
