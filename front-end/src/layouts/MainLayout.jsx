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

const MainLayout = () => {
  useTracking({ autoTrackPageView: true });
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

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-foreground selection:text-background">
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

      {!isHomePage && <Footer />}

      <CustomerChatWidget />
    </div>
  );
};

export default MainLayout;
