import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { CookieConsentBanner } from "../components/shared/CookieConsentBanner";
import {
  BookOpen,
  FileText,
  Shield,
  Truck,
  RotateCcw,
  CreditCard,
  Cookie,
  HelpCircle,
  Ruler,
  Building,
  Mail,
  ChevronRight,
} from "lucide-react";

export function ContentLayout() {
  const location = useLocation();

  const contentNav = [
    { path: "/about", label: "Về Thương Hiệu Atelier", icon: Building },
    { path: "/blog", label: "Tạp Chí & Cảm Hứng", icon: BookOpen },
    { path: "/guide", label: "Hướng Dẫn Đo Size Chuẩn", icon: Ruler },
    { path: "/faq", label: "Câu Hỏi Thường Gặp (FAQ)", icon: HelpCircle },
    { path: "/policy", label: "Tôn Chỉ Thiết Kế & May Đo", icon: FileText },
    { path: "/shipping", label: "Chính Sách Vận Chuyển GHN", icon: Truck },
    { path: "/returns-refunds", label: "Chính Sách Đổi Trả 7 Ngày", icon: RotateCcw },
    { path: "/payment-policy", label: "Phương Thức Thanh Toán", icon: CreditCard },
    { path: "/terms", label: "Điều Khoản Dịch Vụ", icon: FileText },
    { path: "/privacy", label: "Chính Sách Bảo Mật Dữ Liệu", icon: Shield },
    { path: "/cookies", label: "Quản Lý Cookie & Phiên", icon: Cookie },
    { path: "/contact-legal", label: "Thông Tin Pháp Lý & Liên Hệ", icon: Mail },
  ];

  const currentItem = contentNav.find((item) => item.path === location.pathname) || {
    label: "Trung Tâm Thông Tin & Hỗ Trợ",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0e] text-[#f4f0e8] overflow-x-clip" data-template="support-content">
      <Header />

      {/* Content Header Banner */}
      <section className="bg-[#121215] border-b border-[rgba(244,240,232,0.1)] py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#9a989f]">
              <Link to="/" className="hover:text-[#e65100] transition-colors">Trang Chủ</Link>
              <ChevronRight size={12} className="text-[#6b6973]" />
              <span className="text-[#f4f0e8] font-medium">{currentItem.label}</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-wider text-[#f4f0e8] mt-1 uppercase">
              {currentItem.label}
            </h1>
          </div>

          <div className="text-xs font-mono text-[#9a989f]">
            CẬP NHẬT GẦN NHẤT: <span className="text-[#ff6d00]">THÁNG 11 / 2026</span>
          </div>
        </div>
      </section>

      {/* 2-Column Reading Workspace */}
      <div className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 items-start">
          {/* Table of Contents Sticky Sidebar */}
          <aside className="lg:col-span-1 bg-[#121215] border border-[rgba(244,240,232,0.1)] p-4 sticky top-24">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#9a989f] px-3 py-2 border-b border-white/5 mb-2">
              Mục Lục Hỗ Trợ & Chính Sách
            </div>
            <nav className="space-y-1 max-h-[70vh] overflow-y-auto">
              {contentNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[#e65100] text-white font-bold"
                        : "text-[#9a989f] hover:text-[#f4f0e8] hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon size={14} className={isActive ? "text-white" : "text-[#e65100]"} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && <span className="text-[10px] font-mono">●</span>}
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 bg-[#161619] border border-white/5 mt-4 text-xs font-mono text-[#9a989f]">
              <span className="text-[#f4f0e8] block font-bold mb-1">CẦN HỖ TRỢ TRỰC TIẾP?</span>
              <p className="text-[11px] leading-relaxed">
                Đội ngũ cố vấn may đo sẵn sàng giải đáp mọi thắc mắc của bạn qua Hotline <span className="text-[#ff6d00]">1900 6868</span> hoặc tính năng Trợ lý AI.
              </p>
            </div>
          </aside>

          {/* Reading Content Pane */}
          <div className="lg:col-span-3 min-w-0 bg-[#121215] border border-[rgba(244,240,232,0.1)] p-6 sm:p-10 shadow-sm">
            <React.Suspense
              fallback={
                <div className="min-h-[40vh] flex items-center justify-center p-8">
                  <div className="w-8 h-8 border-2 border-[#e65100] border-t-transparent animate-spin" />
                </div>
              }
            >
              <Outlet />
            </React.Suspense>
          </div>
        </div>
      </div>

      <Footer />
      <CookieConsentBanner />
    </div>
  );
}
export default ContentLayout;
