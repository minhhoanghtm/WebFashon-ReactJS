import React from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import LoginBanner from "./LoginBanner";
import LoginForm from "./LoginForm";

const Login = () => {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";
  useDocumentTitle(`Đăng nhập — ${siteName}`);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 lg:grid-cols-12">
        <LoginBanner />
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
