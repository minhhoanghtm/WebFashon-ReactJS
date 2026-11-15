import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Compass, Sparkles } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const NotFound = () => {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "ATELIER ÉTOILE";
  useDocumentTitle(`404 — Không tìm thấy trang | ${siteName}`);

  return (
    <section className="relative mx-auto flex min-h-[75vh] w-full max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
      {/* Background Architectural Watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.03] select-none">
        <span className="font-condensed text-[clamp(10rem,25vw,22rem)] font-black tracking-widest text-foreground">
          404
        </span>
      </div>

      <div className="relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 border border-border px-3.5 py-1 text-[11px] font-medium tracking-[0.24em] text-muted-foreground uppercase">
          <Compass size={13} strokeWidth={1.5} />
          <span>Lạc lối trong không gian Atelier · Void 404</span>
        </div>

        <h1 className="font-condensed text-4xl font-bold tracking-tight text-foreground uppercase sm:text-6xl md:text-7xl">
          Đường dẫn không tồn tại
        </h1>

        <p className="mx-auto max-w-md text-xs font-normal leading-relaxed text-muted-foreground sm:text-sm">
          Thiết kế hoặc trang bạn đang tìm kiếm có thể đã được lưu trữ trong văn khố
          hoặc đường dẫn đã được thay đổi cấu trúc.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/"
            className="btn-cta inline-flex min-h-[48px] items-center justify-center gap-2 border border-foreground bg-foreground px-8 py-3 text-xs font-semibold tracking-[0.2em] text-background uppercase transition-all hover:bg-transparent hover:text-foreground focus-visible:outline-2"
          >
            <ArrowLeft size={14} />
            <span>Về trang chủ</span>
          </Link>

          <Link
            to="/products"
            className="btn-cta inline-flex min-h-[48px] items-center justify-center gap-2 border border-border bg-card px-8 py-3 text-xs font-semibold tracking-[0.2em] text-foreground uppercase transition-all hover:border-foreground focus-visible:outline-2"
          >
            <Sparkles size={14} />
            <span>Khám phá bộ sưu tập</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
