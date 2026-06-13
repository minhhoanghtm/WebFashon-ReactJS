import React from "react";
import resetImage from "@/pages/Home/assets/lookbook-summer.jpg";

const ResetPasswordBanner = () => {
  return (
    <div className="reset-banner">
      <img
        src={resetImage}
        alt="Người mẫu trong trang phục mùa hè phong cách"
        className="reset-banner__image"
        loading="eager"
      />
      <div className="reset-banner__overlay">
        <span className="reset-banner__badge">Khôi phục tài khoản</span>
        <h2 className="reset-banner__title">Tìm lại mật khẩu</h2>
        <p className="reset-banner__desc">
          Đừng lo lắng, hãy thực hiện các bước khôi phục mật khẩu để tiếp tục trải nghiệm dịch vụ và các sản phẩm thời trang mới nhất.
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordBanner;
