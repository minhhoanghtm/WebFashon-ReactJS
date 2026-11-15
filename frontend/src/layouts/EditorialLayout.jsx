import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { AnnouncementBar } from "../components/home/AnnouncementBar";
import { CookieConsentBanner } from "../components/shared/CookieConsentBanner";
import { AiAssistantModal } from "../components/shared/AiAssistantModal";
import { AiStyleQuizModal } from "../components/shared/AiStyleQuizModal";
import { ProductComparisonDrawer } from "../components/shared/ProductComparisonDrawer";

export function EditorialLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0e] text-[#f4f0e8] overflow-x-clip" data-template="editorial-homepage">
      <AnnouncementBar />
      <Header />
      <main className="flex-1 w-full flex flex-col">
        <React.Suspense
          fallback={
            <div className="min-h-[50vh] flex items-center justify-center p-8">
              <div className="w-8 h-8 border-2 border-[#e65100] border-t-transparent animate-spin" />
            </div>
          }
        >
          <Outlet />
        </React.Suspense>
      </main>
      <Footer />
      <CookieConsentBanner />
      <AiAssistantModal />
      <AiStyleQuizModal />
      <ProductComparisonDrawer />
    </div>
  );
}
export default EditorialLayout;
