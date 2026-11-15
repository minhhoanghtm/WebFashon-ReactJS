import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ShieldCheck, PhoneCall, ArrowLeft, CheckCircle2 } from "lucide-react";
import { ThemeSwitcher } from "../components/ui/ThemeSwitcher";
import { SilkVeilTransition } from "../components/shared/SilkVeilTransition";

export function CheckoutLayout() {
  const location = useLocation();

  const isCart = location.pathname === "/cart";
  const isCheckout = location.pathname === "/checkout";
  const isPaymentResult = location.pathname.startsWith("/payment");

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0e] text-[#f4f0e8] overflow-x-clip" data-template="minimal-checkout">
      {/* Minimal Distraction-Free Header */}
      <header className="sticky top-0 z-40 bg-[#121215]/95 backdrop-blur-md border-b border-[rgba(244,240,232,0.1)] px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Logo & Back */}
          <div className="flex items-center gap-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-xs text-[#9a989f] hover:text-[#f4f0e8] transition-colors pr-3 border-r border-white/10"
              title="Quay lại mua sắm"
            >
              <ArrowLeft size={14} />
              <span className="hidden md:inline">Tiếp tục mua sắm</span>
            </Link>
            <Link to="/" className="flex items-center gap-2 font-display text-base font-bold tracking-widest text-[#f4f0e8]">
              <span className="w-2.5 h-2.5 bg-[#e65100]" />
              <span>ATELIER ARCHIVE</span>
            </Link>
          </div>

          {/* Checkout Steps Progress */}
          <nav aria-label="Tiến trình đặt hàng" className="hidden lg:flex items-center gap-6 text-xs font-display tracking-wider uppercase">
            <div className={`flex items-center gap-2 ${isCart ? "text-[#ff6d00] font-bold" : "text-[#9a989f]"}`}>
              <span className={`w-5 h-5 flex items-center justify-center border text-[10px] font-mono ${isCart ? "border-[#e65100] bg-[#e65100] text-white" : "border-white/20"}`}>
                1
              </span>
              <span>Giỏ Hàng</span>
            </div>
            <div className="w-8 h-[1px] bg-white/10" />
            <div className={`flex items-center gap-2 ${isCheckout ? "text-[#ff6d00] font-bold" : "text-[#9a989f]"}`}>
              <span className={`w-5 h-5 flex items-center justify-center border text-[10px] font-mono ${isCheckout ? "border-[#e65100] bg-[#e65100] text-white" : "border-white/20"}`}>
                2
              </span>
              <span>Thanh Toán</span>
            </div>
            <div className="w-8 h-[1px] bg-white/10" />
            <div className={`flex items-center gap-2 ${isPaymentResult ? "text-[#ff6d00] font-bold" : "text-[#9a989f]"}`}>
              <span className={`w-5 h-5 flex items-center justify-center border text-[10px] font-mono ${isPaymentResult ? "border-[#e65100] bg-[#e65100] text-white" : "border-white/20"}`}>
                3
              </span>
              <span>Hoàn Tất</span>
            </div>
          </nav>

          {/* Trust Badges & Theme Switcher */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <ShieldCheck size={16} />
              <span>SSL 256-BIT</span>
            </div>
            <ThemeSwitcher />
            <a
              href="tel:19006868"
              className="inline-flex items-center gap-1 text-xs text-[#9a989f] hover:text-[#f4f0e8] transition-colors pl-2 border-l border-white/10"
              title="Hotline hỗ trợ đặt hàng"
            >
              <PhoneCall size={13} className="text-[#e65100]" />
              <span className="hidden md:inline font-mono">1900 6868</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Checkout Viewport */}
      <main className="flex-1 w-full flex flex-col py-6">
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

      {/* Minimal Checkout Trust Footer */}
      <footer className="bg-[#121215] border-t border-[rgba(244,240,232,0.1)] py-6 px-4 text-xs text-[#9a989f]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-[#f4f0e8]">
              <CheckCircle2 size={13} className="text-emerald-400" /> Cam kết may đo chuẩn phom
            </span>
            <span className="flex items-center gap-1 text-[#f4f0e8]">
              <CheckCircle2 size={13} className="text-emerald-400" /> Miễn phí đổi size trong 7 ngày
            </span>
            <span className="flex items-center gap-1 text-[#f4f0e8]">
              <CheckCircle2 size={13} className="text-emerald-400" /> Giao hàng hỏa tốc toàn quốc
            </span>
          </div>

          <div className="text-[11px] font-mono text-center sm:text-right">
            © {new Date().getFullYear()} ATELIER ARCHIVE. BẢO MẬT THANH TOÁN TIÊU CHUẨN QUỐC TẾ.
          </div>
        </div>
      </footer>
    </div>
  );
}
export default CheckoutLayout;
