import React from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import ResetPasswordBanner from "./ResetPasswordBanner";
import ResetPasswordForm from "./ResetPasswordForm";

const ResetPassword = () => {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";
  useDocumentTitle(`Khôi phục mật khẩu — ${siteName}`);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 lg:grid-cols-12">
        <ResetPasswordBanner />
        <ResetPasswordForm />
      </div>
    </div>
  );
};

export default ResetPassword;
