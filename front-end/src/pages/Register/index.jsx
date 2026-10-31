import React from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import RegisterBanner from "./RegisterBanner";
import RegisterForm from "./RegisterForm";

const Register = () => {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";
  useDocumentTitle(`Đăng ký — ${siteName}`);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 lg:grid-cols-12">
        <RegisterBanner />
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;
