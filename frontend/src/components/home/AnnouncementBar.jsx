import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, X, Copy, Check } from "lucide-react";

export function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const announcements = [
    {
      text: "MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC CHO ĐƠN HÀNG TỪ 1.000.000 ₫",
      badge: "FREESHIP",
      link: "/shipping",
    },
    {
      text: "BỘ SƯU TẬP MAY ĐO THU ĐÔNG 2026/27 — ĐÃ CÓ MẶT TẠI ATELIER",
      badge: "NEW CAPSULE",
      link: "/products",
    },
    {
      text: "ƯU ĐÃI ĐỘC QUYỀN: NHẬP 'ATELIER10' ĐỂ ĐƯỢC GIẢM 10% ĐƠN ĐẦU TIÊN",
      badge: "VOUCHER",
      isCode: true,
      code: "ATELIER10",
      link: "/vouchers",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [announcements.length]);

  if (!isVisible) return null;

  const current = announcements[currentIndex];

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (current.code) {
      navigator.clipboard.writeText(current.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full bg-[#161619] border-b border-[rgba(244,240,232,0.12)] text-[#f4f0e8] text-[11px] font-mono tracking-wider py-2 px-4 transition-all">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
        {/* Left Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-[#9a989f]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e65100] animate-pulse" />
          <span className="text-[10px] uppercase">ATELIER BULLETIN</span>
        </div>

        {/* Center Rotating Message */}
        <div className="flex-1 flex items-center justify-center text-center overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-3 transition-opacity duration-300">
            <span className="px-1.5 py-0.5 bg-[#e65100]/20 text-[#ff6d00] border border-[#e65100]/40 text-[9px] uppercase font-bold">
              {current.badge}
            </span>
            <Link
              to={current.link}
              className="hover:text-[#e65100] transition-colors truncate max-w-[280px] sm:max-w-md md:max-w-none"
            >
              {current.text}
            </Link>

            {current.isCode && (
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/10 hover:bg-white/20 text-[#f4f0e8] rounded text-[10px] transition-colors"
                title="Sao chép mã"
              >
                {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                <span>{copied ? "Đã chép" : "Sao chép"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="text-[#9a989f] hover:text-[#f4f0e8] p-1 transition-colors"
          aria-label="Đóng thông báo"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
