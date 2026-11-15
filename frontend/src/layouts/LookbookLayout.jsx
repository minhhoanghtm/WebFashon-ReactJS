import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { CookieConsentBanner } from "../components/shared/CookieConsentBanner";
import { SilkVeilTransition } from "../components/shared/SilkVeilTransition";
import { BookOpen, Sparkles, Compass } from "lucide-react";

export function LookbookLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0e] text-[#f4f0e8] overflow-x-clip" data-template="editorial-lookbook">
      <Header />

      {/* Lookbook Editorial Season Bar */}
      <section className="bg-[#121215] border-b border-[rgba(244,240,232,0.1)] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#ff6d00] uppercase tracking-widest mb-1">
              <Sparkles size={13} />
              <span>ATELIER EDITORIAL ARCHIVE • SEASON 2026</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-wider text-[#f4f0e8] uppercase">
              LOOKBOOK & BỘ SƯU TẬP THEO MÙA
            </h1>
          </div>

          {/* Season Selector Chips */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 md:pb-0 text-xs font-display tracking-wider uppercase">
            <span className="px-3.5 py-1.5 bg-[#e65100] text-white font-bold border border-[#e65100]">
              Xuân / Hè '26
            </span>
            <span className="px-3.5 py-1.5 bg-[#161619] text-[#9a989f] border border-white/10 hover:text-white cursor-pointer transition-colors">
              Thu / Đông '25
            </span>
            <span className="px-3.5 py-1.5 bg-[#161619] text-[#9a989f] border border-white/10 hover:text-white cursor-pointer transition-colors">
              Resort Capsule
            </span>
            <span className="px-3.5 py-1.5 bg-[#161619] text-[#9a989f] border border-white/10 hover:text-white cursor-pointer transition-colors hidden lg:inline-block">
              Monochrome Silk
            </span>
          </div>
        </div>
      </section>

      {/* Main Full-Bleed Lookbook Experience */}
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
export default LookbookLayout;
