import React from "react";
import { Link, Outlet } from "react-router-dom";
import { ThemeSwitcher } from "../components/ui/ThemeSwitcher";
import { SilkVeilTransition } from "../components/shared/SilkVeilTransition";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#08080a] text-[#f4f0e8] p-4 sm:p-6 overflow-x-clip" data-template="authentication">
      {/* Auth Top Header */}
      <header className="max-w-[1440px] mx-auto w-full pt-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#9a989f] hover:text-[#f4f0e8] transition-colors pr-3 border-r border-white/10"
            title="Quay lại cửa hàng"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Trang Chủ</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 font-display text-base font-bold tracking-widest text-[#f4f0e8]">
            <span className="w-2.5 h-2.5 bg-[#e65100]" />
            <span>WEBFASHION ATELIER</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <ShieldCheck size={15} />
            <span>XÁC THỰC BẢO MẬT</span>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Centered Auth Card Container */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md bg-[#121215] border border-[rgba(244,240,232,0.12)] p-6 sm:p-8 shadow-2xl">
          <SilkVeilTransition>
            <React.Suspense
              fallback={
                <div className="min-h-[30vh] flex items-center justify-center p-8">
                  <div className="w-8 h-8 border-2 border-[#e65100] border-t-transparent animate-spin" />
                </div>
              }
            >
              <Outlet />
            </React.Suspense>
          </SilkVeilTransition>
        </div>
      </div>

      {/* Auth Footer */}
      <footer className="max-w-[1440px] mx-auto w-full pb-3 text-center text-xs text-[#6b6973] font-mono">
        © {new Date().getFullYear()} WEBFASHION ATELIER. BẢO MẬT DỮ LIỆU CHUẨN GDPR VÀ NGHỊ ĐỊNH 13/2023/NĐ-CP.
      </footer>
    </div>
  );
}
export default AuthLayout;
