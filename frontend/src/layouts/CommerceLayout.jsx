import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { CookieConsentBanner } from "../components/shared/CookieConsentBanner";
import { AiAssistantModal } from "../components/shared/AiAssistantModal";
import { ProductComparisonDrawer } from "../components/shared/ProductComparisonDrawer";
import { SilkVeilTransition } from "../components/shared/SilkVeilTransition";
import { ChevronRight, SlidersHorizontal, Heart, Ticket } from "lucide-react";

export function CommerceLayout() {
  const location = useLocation();

  const getPageInfo = () => {
    if (location.pathname.startsWith("/favorites")) {
      return { title: "Danh Sách Yêu Thích", icon: Heart, desc: "Bộ sưu tập các thiết kế bạn quan tâm và lưu lại" };
    }
    if (location.pathname.startsWith("/vouchers")) {
      return { title: "Đặc Quyền Voucher", icon: Ticket, desc: "Các mã ưu đãi may đo giới hạn dành riêng cho bạn" };
    }
    return { title: "Bộ Sưu Tập Thời Trang", icon: SlidersHorizontal, desc: "Khám phá các thiết kế may đo đương đại cao cấp" };
  };

  const pageInfo = getPageInfo();
  const Icon = pageInfo.icon;

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0e] text-[#f4f0e8] overflow-x-clip" data-template="product-discovery">
      <Header />
      
      {/* Commerce Sub-Header / Breadcrumb Bar */}
      <section className="bg-[#121215] border-b border-[rgba(244,240,232,0.08)] py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[#9a989f]">
            <Link to="/" className="hover:text-[#e65100] transition-colors">Trang Chủ</Link>
            <ChevronRight size={12} className="text-[#6b6973]" />
            <span className="text-[#f4f0e8] font-medium flex items-center gap-1.5">
              <Icon size={13} className="text-[#e65100]" />
              <span>{pageInfo.title}</span>
            </span>
          </nav>

          {/* Commerce Quick Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 text-[11px] font-display uppercase tracking-wider">
            <Link
              to="/products"
              className={`px-3 py-1.5 border transition-all ${
                location.pathname === "/products"
                  ? "border-[#e65100] text-[#ff6d00] bg-[rgba(230,81,0,0.08)] font-semibold"
                  : "border-[rgba(244,240,232,0.15)] text-[#9a989f] hover:text-[#f4f0e8] hover:border-[rgba(244,240,232,0.3)]"
              }`}
            >
              Tất Cả
            </Link>
            <Link
              to="/favorites"
              className={`px-3 py-1.5 border transition-all ${
                location.pathname === "/favorites"
                  ? "border-[#e65100] text-[#ff6d00] bg-[rgba(230,81,0,0.08)] font-semibold"
                  : "border-[rgba(244,240,232,0.15)] text-[#9a989f] hover:text-[#f4f0e8] hover:border-[rgba(244,240,232,0.3)]"
              }`}
            >
              Yêu Thích
            </Link>
            <Link
              to="/vouchers"
              className={`px-3 py-1.5 border transition-all ${
                location.pathname === "/vouchers"
                  ? "border-[#e65100] text-[#ff6d00] bg-[rgba(230,81,0,0.08)] font-semibold"
                  : "border-[rgba(244,240,232,0.15)] text-[#9a989f] hover:text-[#f4f0e8] hover:border-[rgba(244,240,232,0.3)]"
              }`}
            >
              Vouchers
            </Link>
          </div>
        </div>
      </section>

      {/* Main Commerce Workspace */}
      <main className="flex-1 w-full flex flex-col">
        <SilkVeilTransition>
          <React.Suspense
            fallback={
              <div className="min-h-[50vh] flex items-center justify-center p-8">
                <div className="w-8 h-8 border-2 border-[#e65100] border-t-transparent animate-spin" />
              </div>
            }
          >
            <Outlet />
          </React.Suspense>
        </SilkVeilTransition>
      </main>

      <Footer />
      <CookieConsentBanner />
      <AiAssistantModal />
      <ProductComparisonDrawer />
    </div>
  );
}
export default CommerceLayout;
