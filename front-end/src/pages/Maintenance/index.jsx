import React from "react";
import { Link } from "react-router-dom";
import useWebsiteSettings from "@/hooks/useWebsiteSettings";
import { Wrench, Clock, ShieldCheck } from "lucide-react";

export const MaintenancePage = ({ message, until }) => {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "Web Fashion";
  const displayMessage =
    message ||
    settings?.system?.maintenanceMessage ||
    "Hệ thống đang được nâng cấp định kỳ để hoàn thiện trải nghiệm mua sắm tốt hơn. Quý khách vui lòng quay lại sau ít phút.";

  const maintenanceUntilDate = until || settings?.system?.maintenanceUntil;
  const formattedUntil = maintenanceUntilDate
    ? new Date(maintenanceUntilDate).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <div
      data-testid="maintenance-screen"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#0a0a0a] text-zinc-100 p-6 md:p-12 overflow-y-auto selection:bg-zinc-800 selection:text-white"
    >
      {/* Top Brand Header */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <span className="text-xs font-serif tracking-widest text-zinc-300">404</span>
          </div>
          <span className="text-sm font-medium tracking-widest uppercase text-zinc-300 font-serif">
            {siteName}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span>Bảo trì hệ thống</span>
        </div>
      </div>

      {/* Center Content */}
      <div className="max-w-xl mx-auto my-auto text-center py-12 px-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <Wrench className="w-7 h-7 text-zinc-300 stroke-[1.5]" />
        </div>

        <h1 className="text-2xl md:text-3xl font-serif tracking-wide text-zinc-100 mb-4">
          Tạm Dừng Hoạt Động Để Nâng Cấp
        </h1>

        <p className="text-sm md:text-base text-zinc-400 leading-relaxed max-w-md mx-auto mb-8 font-light">
          {displayMessage}
        </p>

        {formattedUntil && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs mb-8">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span>Dự kiến hoàn tất: <strong className="text-zinc-100 font-medium">{formattedUntil}</strong></span>
          </div>
        )}

        <div className="pt-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-zinc-400" />
          <span>Dữ liệu và giao dịch của quý khách vẫn được bảo mật an toàn</span>
        </div>
      </div>

      {/* Discrete Admin Link at Bottom */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400 pt-6 border-t border-zinc-900">
        <span>© {new Date().getFullYear()} {siteName}. All rights reserved.</span>
        <Link
          to="/login"
          className="text-zinc-400 hover:text-zinc-200 transition-colors underline-offset-4 hover:underline py-2 px-3 inline-flex items-center gap-1 min-h-[44px]"
        >
          Cổng quản trị viên →
        </Link>
      </div>
    </div>
  );
};

export default MaintenancePage;
