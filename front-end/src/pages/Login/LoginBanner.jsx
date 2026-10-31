import React, { useState } from "react";
import loginImage from "@/pages/Home/assets/lookbook-evening.jpg";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const LoginBanner = () => {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-secondary p-10 lg:flex lg:col-span-6 xl:p-14">
      {!imgFailed && loginImage ? (
        <img
          src={loginImage}
          alt="Bộ sưu tập thời trang đơn sắc cao cấp"
          onError={() => setImgFailed(true)}
          className="absolute inset-0 h-full w-full object-cover object-center opacity-45 grayscale contrast-110"
          loading="eager"
        />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-background/30" />

      <div className="relative z-10 flex items-center justify-between border-b border-border/80 pb-4 text-[10px] tracking-[0.24em] uppercase text-muted-foreground">
        <span>{siteName} · ATELIER</span>
        <span>MONOCHROME ARCHIVE</span>
      </div>

      <div className="relative z-10 my-auto max-w-md space-y-4 py-12">
        <span className="atelier-seal">{siteName} · BỘ SƯU TẬP GIÁM TUYỂN</span>
        <h2 className="pt-2 font-serif text-4xl leading-[1.08] font-normal tracking-tight text-foreground xl:text-5xl">
          Chào mừng trở lại không gian lưu trữ.
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Đăng nhập để đồng bộ danh sách yêu thích, quản lý sổ địa chỉ giao
          hàng và theo dõi các thiết kế đã đặt may.
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-border/80 pt-4 text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
        <span>NOIR · BONE · SLATE</span>
        <span>VIETNAM</span>
      </div>
    </div>
  );
};

export default LoginBanner;
