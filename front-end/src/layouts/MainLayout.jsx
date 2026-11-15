import React, { useEffect, useRef, useState } from "react";
import {
  useSearchParams,
  useLocation,
  useNavigationType,
  useOutlet,
} from "react-router-dom";
import CinematicHeader from "@/pages/Home/components/CinematicHeader";
import Footer from "@/components/Footer";
import CustomerChatWidget from "@/components/CustomerChatWidget";
import useTracking from "@/hooks/useTracking";
import useFeatureFlags from "@/hooks/useFeatureFlags";
import { useAuthStore } from "@/store/auth.store";
import MaintenancePage from "@/pages/Maintenance";
import MaintenanceAdminBanner from "@/components/admin/MaintenanceAdminBanner";

const MainLayout = () => {
  useTracking({ autoTrackPageView: true });
  const { flags } = useFeatureFlags();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [searchParams] = useSearchParams();
  const [homeSearchTerm, setHomeSearchTerm] = useState(
    () => searchParams.get("search") || ""
  );
  const mainContentRef = useRef(null);
  const location = useLocation();
  const navType = useNavigationType();
  // `pathname` intentionally excludes query strings and hashes, so `/?search=x`
  // and `/#lookbook` remain the homepage.
  const isHomePage = location.pathname === "/";

  const currentOutlet = useOutlet({ homeSearchTerm, setHomeSearchTerm });

  useEffect(() => {
    if (navType !== "POP") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location.pathname, navType]);

  // If maintenance mode is active:
  // - Non-admin visitors see the full takeover MaintenancePage (no header, footer, chat)
  // - Admin users see storefront normally with a top warning banner
  if (flags.maintenanceMode && !isAdmin) {
    return (
      <MaintenancePage
        message={flags.maintenanceMessage}
        until={flags.maintenanceUntil}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-foreground selection:text-background">
      {/* Sticky Admin reminder banner when maintenance mode is active */}
      {flags.maintenanceMode && isAdmin && <MaintenanceAdminBanner />}

      {/* WCAG 2.2 AA Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-primary focus:px-4 focus:py-2.5 focus:text-xs focus:font-semibold focus:tracking-widest focus:uppercase focus:text-primary-foreground"
      >
        Chuyển đến nội dung chính
      </a>

      {!isHomePage && (
        <CinematicHeader
          searchTerm={homeSearchTerm}
          onSearchTermChange={setHomeSearchTerm}
          isHomePage={false}
        />
      )}

      <main
        id="main-content"
        ref={mainContentRef}
        key={location.pathname}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) {
            e.currentTarget.classList.remove("page-fade-enter");
            e.currentTarget.style.willChange = "auto";
          }
        }}
        className={`flex flex-1 flex-col page-fade-enter ${!isHomePage ? "pt-20" : ""}`}
      >
        {currentOutlet}
      </main>

      <Footer />

      <CustomerChatWidget />
    </div>
  );
};

export default MainLayout;
