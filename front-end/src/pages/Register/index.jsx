import React from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import RegisterBanner from "./RegisterBanner";
import RegisterForm from "./RegisterForm";
import "./register.css";

const Register = () => {
  useDocumentTitle("Đăng ký");

  return (
    <div className="register-page">
      <div className="register-wrapper">
        <div className="register-card">
          <RegisterBanner />
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default Register;
