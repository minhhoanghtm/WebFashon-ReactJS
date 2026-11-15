import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import useTracking from "@/hooks/useTracking";

const AuthLayout = () => {
  useTracking({ autoTrackPageView: true });
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div
      key={location.pathname}
      className="page-fade-enter min-h-screen bg-background font-sans text-foreground antialiased pb-56 sm:pb-40"
    >
      <Outlet />
    </div>
  );
};

export default AuthLayout;
