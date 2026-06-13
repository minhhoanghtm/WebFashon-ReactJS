import React from "react";
import loginImage from "@/assets/login.png";

const LoginBanner = () => {
  return (
    <div className="login-banner">
      <img
        src={loginImage}
        alt="Hình ảnh đăng nhập thời trang"
        className="login-banner__image"
        loading="eager"
      />
      <div className="login-banner__overlay">
        <h2 className="login-banner__title">Chào mừng trở lại</h2>
        <p className="login-banner__desc">
          Đăng nhập để tiếp tục mua sắm và khám phá những sản phẩm phù hợp với bạn.
        </p>
      </div>
    </div>
  );
};

export default LoginBanner;
