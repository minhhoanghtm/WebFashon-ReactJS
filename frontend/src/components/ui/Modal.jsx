import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-xl" }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${maxWidth} bg-[#161619] border border-[rgba(244,240,232,0.15)] shadow-2xl p-6 overflow-hidden animate-fade-in`}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[rgba(244,240,232,0.1)]">
          <h3 className="font-display text-lg tracking-wider text-[#f4f0e8] uppercase">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-[#9a989f] hover:text-[#f4f0e8] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function Drawer({ isOpen, onClose, title, children, side = "right" }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md h-full bg-[#121215] border-l border-[rgba(244,240,232,0.15)] shadow-2xl flex flex-col p-6 animate-fade-in overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(244,240,232,0.1)]">
          <h3 className="font-display text-lg tracking-wider text-[#f4f0e8] uppercase">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-[#9a989f] hover:text-[#f4f0e8] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Đóng ngăn kéo"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
