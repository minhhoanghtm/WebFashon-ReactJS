import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

const AuthLayout = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
