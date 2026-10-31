import React from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import ResetPasswordBanner from "./ResetPasswordBanner";
import ResetPasswordForm from "./ResetPasswordForm";

const ResetPassword = () => {
  useDocumentTitle("Quên mật khẩu");

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl border border-[var(--color-border)] bg-[var(--color-surface)] grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        <ResetPasswordBanner />
        <ResetPasswordForm />
      </div>
    </div>
  );
};

export default ResetPassword;
