import React from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import LoginBanner from "./LoginBanner";
import LoginForm from "./LoginForm";
import "./login.css";

const Login = () => {
  useDocumentTitle("Đăng nhập");

  return (
    <div className="login-page">
      <div className="login-container">
        <LoginBanner />
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
