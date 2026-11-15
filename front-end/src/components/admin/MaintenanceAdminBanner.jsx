import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Power, Settings as SettingsIcon, Loader2 } from "lucide-react";
import useWebsiteSettings from "@/hooks/useWebsiteSettings";
import { toast } from "react-toastify";

export const MaintenanceAdminBanner = () => {
  const { settings, updateSettings } = useWebsiteSettings();
  const [toggling, setToggling] = useState(false);

  if (!settings?.system?.maintenanceMode) {
    return null;
  }

  const handleTurnOff = async () => {
    setToggling(true);
    try {
      await updateSettings({
        ...settings,
        system: {
          ...(settings.system || {}),
          maintenanceMode: false,
        },
      });
      toast.success("Đã tắt chế độ bảo trì. Storefront đã mở lại cho khách.");
    } catch (err) {
      toast.error("Không thể tắt chế độ bảo trì: " + (err.message || "Lỗi mạng"));
    } finally {
      setToggling(false);
    }
  };

  return (
    <aside
      aria-label="Thông báo bảo trì dành cho quản trị viên"
      className="sticky top-0 z-50 w-full bg-amber-500 text-black px-4 py-2 text-xs md:text-sm font-medium shadow-md flex items-center justify-between flex-wrap gap-2 transition-all"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-black animate-pulse" />
        <span>
          <strong>Đang bật chế độ bảo trì:</strong> Khách hàng không thể xem storefront. Bạn đang truy cập với quyền Quản trị viên.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleTurnOff}
          disabled={toggling}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white hover:bg-zinc-800 rounded text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 min-h-[32px]"
        >
          {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
          <span>Tắt bảo trì ngay</span>
        </button>
        <Link
          to="/admin/settings"
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-black rounded text-xs transition-colors min-h-[32px]"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Cài đặt</span>
        </Link>
      </div>
    </aside>
  );
};

export default MaintenanceAdminBanner;
