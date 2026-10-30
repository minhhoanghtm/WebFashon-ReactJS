import React from "react";
import loginImage from "@/pages/Home/assets/lookbook-evening.jpg";
import useWebsiteSettings from "@/hooks/useWebsiteSettings";

const LoginBanner = () => {
  const {settings} = useWebsiteSettings();
  const general = settings?.general || {};
  const siteName = general.siteName || "";
  return (
    <div className="login-banner">
      <img
        src={loginImage}
        alt="Người mẫu trong bộ sưu tập thời trang hiện đại"
        className="login-banner__image"
        loading="eager"
      />
      <div className="login-banner__overlay">
        <span className="login-banner__badge">{siteName}</span>
        <h2 className="login-banner__title">Chào mừng trở lại</h2>
        <p className="login-banner__desc">
          Đăng nhập để tiếp tục mua sắm và khám phá những bộ sưu tập mới nhất
          dành cho bạn.
        </p>
      </div>
    </div>
  );
};

export default LoginBanner;
