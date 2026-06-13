import React from "react";
import registerImage from "@/assets/register.png";

const RegisterBanner = () => {
  return (
    <div className="register-banner">
      <img
        src={registerImage}
        alt="Người mẫu trong bộ sưu tập thời trang cao cấp"
        className="register-banner__image"
        loading="eager"
      />
      <div className="register-banner__overlay">
        <span className="register-banner__badge">Thành viên mới</span>
        <h2 className="register-banner__title">Gia nhập cùng chúng tôi</h2>
        <p className="register-banner__desc">
          Tạo tài khoản để lưu lại sản phẩm yêu thích, theo dõi đơn hàng và khám
          phá những bộ sưu tập mới nhất.
        </p>
      </div>
    </div>
  );
};

export default RegisterBanner;
