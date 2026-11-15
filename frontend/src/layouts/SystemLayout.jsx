import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { CookieConsentBanner } from "../components/shared/CookieConsentBanner";

export function SystemLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0e] text-[#f4f0e8] overflow-x-clip" data-template="system-error">
      <Header />
      <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-8">
        <React.Suspense
          fallback={
            <div className="min-h-[40vh] flex items-center justify-center p-8">
              <div className="w-8 h-8 border-2 border-[#e65100] border-t-transparent animate-spin" />
            </div>
          }
        >
          <Outlet />
        </React.Suspense>
      </main>
      <Footer />
      <CookieConsentBanner />
    </div>
  );
}
export default SystemLayout;
