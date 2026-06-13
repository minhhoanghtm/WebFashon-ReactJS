import React from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import ResetPasswordBanner from "./ResetPasswordBanner";
import ResetPasswordForm from "./ResetPasswordForm";
import "./resetPassword.css";

const ResetPassword = () => {
  useDocumentTitle("Quên mật khẩu");

  return (
    <div className="reset-page">
      <div className="reset-wrapper">
        <div className="reset-card">
          <ResetPasswordBanner />
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
