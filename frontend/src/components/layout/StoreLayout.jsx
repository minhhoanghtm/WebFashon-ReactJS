import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CookieConsentBanner } from "../shared/CookieConsentBanner";
import { AiAssistantModal } from "../shared/AiAssistantModal";
import { AiStyleQuizModal } from "../shared/AiStyleQuizModal";
import { ProductComparisonDrawer } from "../shared/ProductComparisonDrawer";

export function StoreLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0e] text-[#f4f0e8] overflow-x-clip">
      <Header />
      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>
      <Footer />
      <CookieConsentBanner />
      <AiAssistantModal />
      <AiStyleQuizModal />
      <ProductComparisonDrawer />
    </div>
  );
}

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#08080a] text-[#f4f0e8] p-4 sm:p-6 overflow-x-clip">
      <div className="max-w-[1440px] mx-auto w-full pt-4">
        <a href="/" className="inline-flex items-center gap-2 font-display text-lg tracking-widest text-[#f4f0e8]">
          <span className="w-2.5 h-2.5 bg-[#e65100]" />
          <span>WEBFASHION ATELIER</span>
        </a>
      </div>
      <div className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-md bg-[#121215] border border-[rgba(244,240,232,0.12)] p-6 sm:p-8 shadow-2xl animate-fade-in">
          <Outlet />
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto w-full pb-4 text-center text-xs text-[#6b6973] font-mono">
        © {new Date().getFullYear()} WEBFASHION. BẢO MẬT XÁC THỰC HAI LỚP.
      </div>
    </div>
  );
}
