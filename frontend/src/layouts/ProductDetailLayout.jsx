import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { CookieConsentBanner } from "../components/shared/CookieConsentBanner";
import { SilkVeilTransition } from "../components/shared/SilkVeilTransition";
import { ChevronRight, ArrowLeft } from "lucide-react";

export function ProductDetailLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0e] text-[#f4f0e8] overflow-x-clip" data-template="product-detail">
      <Header />

      {/* Product Detail Sub-Header Bar */}
      <section className="bg-[#121215] border-b border-[rgba(244,240,232,0.08)] py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#9a989f]">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-[#f4f0e8] hover:text-[#e65100] transition-colors pr-2 border-r border-white/10"
              title="Quay lại trang trước"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Quay Lại</span>
            </button>
            <Link to="/" className="hover:text-[#e65100] transition-colors">Trang Chủ</Link>
            <ChevronRight size={12} className="text-[#6b6973]" />
            <Link to="/products" className="hover:text-[#e65100] transition-colors">Bộ Sưu Tập</Link>
            <ChevronRight size={12} className="text-[#6b6973]" />
            <span className="text-[#f4f0e8] font-medium truncate max-w-[200px] sm:max-w-none">
              Chi Tiết Thiết Kế
            </span>
          </div>

          <div className="text-[11px] font-mono text-[#9a989f] hidden sm:block">
            BẢO HÀNH TRỌN ĐỜI ĐƯỜNG MAY • MIỄN PHÍ ĐỔI SIZE 7 NGÀY
          </div>
        </div>
      </section>

      {/* Main Product Experience */}
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
    </div>
  );
}
export default ProductDetailLayout;
