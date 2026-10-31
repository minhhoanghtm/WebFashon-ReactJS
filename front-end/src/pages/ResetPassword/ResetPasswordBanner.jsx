import React, { useState } from "react";
import resetImage from "@/pages/Home/assets/lookbook-summer.jpg";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const ResetPasswordBanner = () => {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WebFashion";
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <aside className="relative hidden lg:flex flex-col justify-between p-10 bg-neutral-950 text-neutral-100 overflow-hidden min-h-[540px]">
      {!imgFailed && resetImage ? (
        <img
          src={resetImage}
          alt="Bộ sưu tập thời trang đơn sắc"
          className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale contrast-125"
          loading="eager"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black"
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.24em] text-neutral-300 font-medium">
          {siteName}
        </span>
        <span className="atelier-seal">Atelier Security</span>
      </div>

      <div className="relative z-10 max-w-sm space-y-3">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-white">
          Khôi phục quyền truy cập
        </h2>
        <p className="text-xs leading-relaxed text-neutral-300">
          Thực hiện xác thực email qua mã OTP bảo mật để thiết lập lại mật khẩu
          cho tài khoản cá nhân của bạn.
        </p>
      </div>
    </aside>
  );
};

export default ResetPasswordBanner;
