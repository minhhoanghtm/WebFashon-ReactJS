import React, { useState } from "react";
import registerImage from "@/pages/Home/assets/hero-atelier.webp";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const RegisterBanner = () => {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <aside
      aria-label="Khám phá đặc quyền thành viên"
      className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-neutral-950 p-10 text-neutral-100 lg:flex lg:col-span-5 xl:p-14"
    >
      {!imgFailed && registerImage ? (
        <img
          src={registerImage}
          alt="Không gian thiết kế thời trang đơn sắc"
          onError={() => setImgFailed(true)}
          className="absolute inset-0 h-full w-full object-cover object-center opacity-40 grayscale contrast-125"
          loading="eager"
        />
      ) : (
        <div
          className="absolute inset-0 bg-neutral-900"
          aria-hidden="true"
        />
      )}

      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/50 to-neutral-950/30" />

      {/* Top micro metadata */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 text-[10px] font-mono tracking-[0.26em] uppercase text-neutral-400">
        <span>{siteName} · ONBOARDING</span>
        <span>ATELIER REGISTRATION</span>
      </div>

      {/* Center editorial typography */}
      <div className="relative z-10 my-auto max-w-md space-y-4 py-12">
        <span className="inline-block border border-[#C5A880]/50 bg-[#C5A880]/10 px-2.5 py-1 text-[10px] font-mono tracking-[0.24em] uppercase text-[#D4B892]">
          THÀNH VIÊN ĐỘC QUYỀN
        </span>
        <h2 className="pt-2 font-display text-4xl leading-[1.2] font-bold tracking-tight text-white uppercase sm:text-5xl">
          Gia nhập không gian thời trang đơn sắc.
        </h2>
        <p className="text-xs leading-relaxed text-neutral-300 sm:text-sm font-sans">
          Khởi tạo tài khoản cá nhân để lưu giữ danh sách thiết kế yêu thích,
          nhận mã giảm giá may đo đặc biệt và theo dõi đơn hàng minh bạch.
        </p>
      </div>

      {/* Bottom tags */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-mono tracking-[0.24em] uppercase text-neutral-400">
        <span>TAILORED EXPERIENCE</span>
        <span>SECURITY ENCRYPTED</span>
      </div>
    </aside>
  );
};

export default RegisterBanner;
