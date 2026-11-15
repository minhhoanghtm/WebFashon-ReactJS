import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Sliders, Check, X } from "lucide-react";
import { useConsent } from "@/context/ConsentContext";

export const CookieConsentBanner = () => {
  const {
    isBannerVisible,
    acceptEssentialOnly,
    acceptAll,
    openPreferences,
  } = useConsent();

  if (!isBannerVisible) return null;

  return (
    <aside
      aria-label="Thông báo quyền riêng tư và cookie"
      role="region"
      className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-5xl z-40 transition-all duration-300 ease-out pointer-events-none"
    >
      <div className="rounded-2xl border border-white/15 bg-[#0C0C0E]/95 backdrop-blur-md p-4 sm:p-6 text-[#F5F4F0] shadow-2xl shadow-black/60 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pointer-events-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          {/* Content Column */}
          <div className="space-y-1.5 sm:space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-white/10 text-white shrink-0">
                <ShieldCheck size={13} className="sm:size-[14px]" />
              </span>
              <h2 className="font-sans text-xs sm:text-base font-medium tracking-tight text-[#F5F4F0]">
                404 Studio tôn trọng quyền riêng tư của bạn
              </h2>
            </div>
            <p className="text-[11px] sm:text-[13px] leading-relaxed text-[#9E9EA8] line-clamp-2 sm:line-clamp-none">
              Chúng tôi sử dụng cookie cần thiết để vận hành website. Với sự đồng ý của bạn, chúng tôi sử dụng thêm cookie và dữ liệu phân tích, cá nhân hóa để cải thiện trải nghiệm mua sắm. Bạn có thể thay đổi lựa chọn bất cứ lúc nào.
            </p>
            <div className="pt-0.5">
              <Link
                to="/cookies"
                className="inline-flex items-center text-[10px] sm:text-[11px] font-medium tracking-wider uppercase text-white/80 hover:text-white underline underline-offset-4 transition-colors"
              >
                Chính sách Cookie & Quyền riêng tư
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              id="consent-essential-only-btn"
              onClick={acceptEssentialOnly}
              className="touch-target col-span-1 inline-flex min-h-[40px] sm:min-h-[44px] items-center justify-center rounded-lg border border-white/20 bg-transparent px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-colors"
            >
              Chỉ cần thiết
            </button>

            <button
              type="button"
              id="consent-customize-btn"
              onClick={openPreferences}
              className="touch-target col-span-1 inline-flex min-h-[40px] sm:min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-transparent px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-colors"
            >
              <Sliders size={13} />
              <span>Tùy chỉnh</span>
            </button>

            <button
              type="button"
              id="consent-accept-all-btn"
              onClick={acceptAll}
              className="touch-target col-span-2 sm:col-auto inline-flex min-h-[40px] sm:min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-[#F5F4F0] px-4 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold tracking-wider uppercase text-[#0C0C0E] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
            >
              <Check size={14} strokeWidth={2.5} />
              <span>Chấp nhận tất cả</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CookieConsentBanner;
