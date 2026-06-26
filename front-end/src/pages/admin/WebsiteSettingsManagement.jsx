import React, { useState } from "react";
import { useWebsiteSettings } from "../../hooks/useWebsiteSettings";
import { uploadImageService } from "../../services/upload.service";
import {
  Settings,
  Globe,
  Sliders,
  Share2,
  Briefcase,
  Save,
  RefreshCw,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import HeadquartersAddressPicker from "@/components/admin/HeadquartersAddressPicker";


const WebsiteSettingsManagement = () => {
  const {
    settings,
    setSettings,
    loading,
    saving,
    isDirty,
    updateSettings,
    reload,
  } = useWebsiteSettings();
  const general = settings?.general || {};
  const siteName = general.siteName || "";
  useDocumentTitle(`Cài đặt website`);

  const [activeTab, setActiveTab] = useState("general");
  const [uploadingField, setUploadingField] = useState(null);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-650 dark:text-indigo-400" />
        <span className="ml-3 text-lg font-medium text-gray-600 dark:text-slate-400">
          Đang tải cài đặt hệ thống...
        </span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center bg-white dark:bg-slate-800/40 p-8 rounded-2xl border border-gray-150 dark:border-slate-800/80">
        <div className="text-red-500 dark:text-red-400 font-black text-lg">
          Không thể kết nối cài đặt hệ thống
        </div>
        <p className="text-gray-500 dark:text-slate-400 text-sm max-w-md">
          Vui lòng kiểm tra kết nối mạng, đảm bảo rằng backend server đang chạy
          và bạn đã đăng nhập tài khoản Quản trị viên.
        </p>
        <button
          onClick={reload}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition shadow-md cursor-pointer hover:scale-102 active:scale-98"
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại cài đặt
        </button>
      </div>
    );
  }

  const handleInputChange = (group, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value,
      },
    }));
  };

  const handleFileUpload = async (e, group, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingField(field);
      const url = await uploadImageService(file);
      handleInputChange(group, field, url);
      toast.success("Tải lên ảnh thành công! 🖼️");
    } catch {
      toast.error("Tải ảnh lên thất bại. Vui lòng thử lại!");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    if (!isDirty) return;
    const success = await updateSettings(settings);
    if (success) {
      toast.info("Đã đồng bộ cài đặt website");
    }
  };

  const tabs = [
    { id: "general", label: "Cài đặt chung", icon: Settings },
    { id: "contact", label: "Thông tin liên hệ", icon: Globe },
    { id: "seo", label: "Cấu hình SEO", icon: Globe },
    // { id: "system", label: "Hệ thống", icon: Sliders },
    { id: "social", label: "Mạng xã hội & Scripts", icon: Share2 },
    { id: "footer", label: "Thông tin chân trang", icon: Briefcase },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800/40 p-6 rounded-2xl border border-gray-100 dark:border-slate-800/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Cài đặt Website
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Cấu hình thông tin chung, SEO, hệ thống và chính sách mua sắm toàn
            trang
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={reload}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-350 dark:bg-slate-950 text-sm font-semibold rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"

          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Lưu thay đổi
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Tabs */}
        <div className="w-full lg:w-64 shrink-0 bg-white dark:bg-slate-800/40 p-3 rounded-2xl border border-gray-100 dark:border-slate-800/80 shadow-xs h-fit space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-xl transition text-left cursor-pointer
                  ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-bold dark:bg-indigo-950/30 dark:text-indigo-300"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
                  }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1 bg-white dark:bg-slate-800/40 p-6 rounded-2xl border border-gray-100 dark:border-slate-800/80 shadow-xs">
          {/* TAB: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700/60 pb-3">
                Cài đặt chung
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Tên Website *
                  </label>
                  <input
                    type="text"
                    value={settings.general?.siteName || ""}
                    onChange={(e) =>
                      handleInputChange("general", "siteName", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                    placeholder="Ví dụ: Web Fashion"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Giờ làm việc
                  </label>
                  <input
                    type="text"
                    value={settings.general?.workingHours || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "general",
                        "workingHours",
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                    placeholder="Ví dụ: 8:00 - 22:00"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Mô tả Website
                </label>
                <textarea
                  value={settings.general?.siteDescription || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "general",
                      "siteDescription",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 h-24 resize-none"
                  placeholder="Mô tả ngắn về website của bạn..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50 dark:border-slate-800">
                {/* Logo Upload */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Logo Website
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-slate-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                      {settings.general?.logoUrl ? (
                        <img
                          src={settings.general.logoUrl}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-gray-300 dark:text-slate-650 text-xs font-bold">
                          Trống
                        </span>
                      )}
                    </div>
                    <label className="relative flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer">
                      {uploadingField === "logoUrl" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>Tải ảnh logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload(e, "general", "logoUrl")
                        }
                        className="hidden"
                        disabled={uploadingField !== null}
                      />
                    </label>
                  </div>
                </div>

                {/* Favicon Upload */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Favicon (Icon trình duyệt)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-slate-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                      {settings.general?.faviconUrl ? (
                        <img
                          src={settings.general.faviconUrl}
                          alt="Favicon"
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <span className="text-gray-300 dark:text-slate-650 text-xs font-bold">
                          Trống
                        </span>
                      )}
                    </div>
                    <label className="relative flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer">
                      {uploadingField === "faviconUrl" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>Tải ảnh favicon</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload(e, "general", "faviconUrl")
                        }
                        className="hidden"
                        disabled={uploadingField !== null}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTACT */}
          {activeTab === "contact" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700/60 pb-3">
                Thông tin liên hệ
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Số Hotline *
                  </label>
                  <input
                    type="text"
                    value={settings.general?.hotline || ""}
                    onChange={(e) =>
                      handleInputChange("general", "hotline", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                    placeholder="Hotline bán hàng"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Email liên hệ *
                  </label>
                  <input
                    type="email"
                    value={settings.general?.email || ""}
                    onChange={(e) =>
                      handleInputChange("general", "email", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                    placeholder="Email công ty"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Địa chỉ trụ sở *
                </label>
                <HeadquartersAddressPicker
                  value={settings.general?.address || ""}
                  onChange={(addr) =>
                    handleInputChange("general", "address", addr)
                  }
                />
              </div>
            </div>
          )}

          {/* TAB: SEO */}
          {activeTab === "seo" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700/60 pb-3">
                Cấu hình SEO
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  SEO Title mặc định
                </label>
                <input
                  type="text"
                  value={settings.seo?.metaTitle || ""}
                  onChange={(e) =>
                    handleInputChange("seo", "metaTitle", e.target.value)
                  }
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                  placeholder="Thẻ tiêu đề SEO mặc định của trang"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  SEO Keywords (Từ khóa cách nhau bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  value={settings.seo?.metaKeywords || ""}
                  onChange={(e) =>
                    handleInputChange("seo", "metaKeywords", e.target.value)
                  }
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                  placeholder="thoi trang nam, ao so mi, quan tay..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  SEO Description mặc định
                </label>
                <textarea
                  value={settings.seo?.metaDescription || ""}
                  onChange={(e) =>
                    handleInputChange("seo", "metaDescription", e.target.value)
                  }
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 h-24 resize-none"
                  placeholder="Mô tả SEO để hiển thị trên công cụ tìm kiếm Google..."
                />
              </div>

              {/* OG Image */}
              <div className="space-y-3 pt-4 border-t border-gray-50 dark:border-slate-800">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Ảnh chia sẻ Social (OG Image)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-20 bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-slate-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    {settings.seo?.ogImage ? (
                      <img
                        src={settings.seo.ogImage}
                        alt="OG"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-300 dark:text-slate-650 text-xs font-bold">
                        1200 x 630
                      </span>
                    )}
                  </div>
                  <label className="relative flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer">
                    {uploadingField === "ogImage" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>Tải ảnh mạng xã hội</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "seo", "ogImage")}
                      className="hidden"
                      disabled={uploadingField !== null}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SYSTEM */}
          {activeTab === "system" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700/60 pb-3">
                Cấu hình Hệ thống
              </h2>

              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {/* Maintenance Mode */}
                <div className="flex items-center justify-between py-4">
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
                      Chế độ bảo trì hệ thống
                    </h3>
                    <p className="text-xs text-gray-405 dark:text-slate-400">
                      Chặn người dùng truy cập Website để bảo trì kỹ thuật
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.system?.maintenanceMode)}
                      onChange={(e) =>
                        handleInputChange(
                          "system",
                          "maintenanceMode",
                          e.target.checked,
                        )
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-250 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-650 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Allow Guest Checkout */}
                <div className="flex items-center justify-between py-4">
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
                      Mua hàng không cần đăng ký
                    </h3>
                    <p className="text-xs text-gray-405 dark:text-slate-400">
                      Cho phép người dùng mua sắm và thanh toán như Guest
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.system?.allowGuestCheckout)}
                      onChange={(e) =>
                        handleInputChange(
                          "system",
                          "allowGuestCheckout",
                          e.target.checked,
                        )
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-250 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-650 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Enable Voucher */}
                <div className="flex items-center justify-between py-4">
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
                      Sử dụng Mã giảm giá (Voucher)
                    </h3>
                    <p className="text-xs text-gray-405 dark:text-slate-400">
                      Kích hoạt tính năng săn và áp dụng Voucher khi checkout
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.system?.enableVoucher)}
                      onChange={(e) =>
                        handleInputChange(
                          "system",
                          "enableVoucher",
                          e.target.checked,
                        )
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-250 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-650 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Enable Reviews */}
                <div className="flex items-center justify-between py-4">
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
                      Đánh giá sản phẩm
                    </h3>
                    <p className="text-xs text-gray-405 dark:text-slate-400">
                      Cho phép người dùng đã nhận đơn hàng đánh giá sản phẩm
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.system?.enableReviews)}
                      onChange={(e) =>
                        handleInputChange(
                          "system",
                          "enableReviews",
                          e.target.checked,
                        )
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-250 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-650 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SOCIAL & INTEGRATIONS */}
          {activeTab === "social" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700/60 pb-3">
                Liên kết & Tích hợp
              </h2>

              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
                  Đường dẫn mạng xã hội
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                      Facebook URL
                    </span>
                    <input
                      type="text"
                      value={settings.socialLinks?.facebook || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "socialLinks",
                          "facebook",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                      Instagram URL
                    </span>
                    <input
                      type="text"
                      value={settings.socialLinks?.instagram || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "socialLinks",
                          "instagram",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                      Tiktok URL
                    </span>
                    <input
                      type="text"
                      value={settings.socialLinks?.tiktok || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "socialLinks",
                          "tiktok",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                      placeholder="https://tiktok.com/@..."
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                      Youtube Channel URL
                    </span>
                    <input
                      type="text"
                      value={settings.socialLinks?.youtube || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "socialLinks",
                          "youtube",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                      Zalo Hotline/Link
                    </span>
                    <input
                      type="text"
                      value={settings.socialLinks?.zalo || ""}
                      onChange={(e) =>
                        handleInputChange("socialLinks", "zalo", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                      placeholder="Số điện thoại Zalo hoặc link Zalo OA"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-150 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
                  Tích hợp Code Scripts (Analytics / Tracking)
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                      Google Tag Manager ID
                    </span>
                    <input
                      type="text"
                      value={settings.integrations?.googleTagManager || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "integrations",
                          "googleTagManager",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                      placeholder="GTM-XXXXXX"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                        Google Analytics ID (G-ID)
                      </span>
                      <input
                        type="text"
                        value={settings.integrations?.googleAnalytics || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "integrations",
                            "googleAnalytics",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                        placeholder="G-XXXXXXXXXX"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                        Facebook Pixel ID
                      </span>
                      <input
                        type="text"
                        value={settings.integrations?.facebookPixel || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "integrations",
                            "facebookPixel",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                        placeholder="Pixel ID"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                      Chatbot Script (Nhúng code chat live)
                    </span>
                    <textarea
                      value={settings.integrations?.chatbotScript || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "integrations",
                          "chatbotScript",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-mono text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 h-20 resize-none"
                      placeholder="<!-- Paste livechat script code here -->"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FOOTER */}
          {activeTab === "footer" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700/60 pb-3">
                Thông tin chân trang
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Tên công ty sở hữu
                </label>
                <input
                  type="text"
                  value={settings.footer?.companyName || ""}
                  onChange={(e) =>
                    handleInputChange("footer", "companyName", e.target.value)
                  }
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                  placeholder="Công ty Cổ phần Thời trang 404Studio"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Mã số thuế (Mã số DN)
                </label>
                <input
                  type="text"
                  value={settings.footer?.taxCode || ""}
                  onChange={(e) =>
                    handleInputChange("footer", "taxCode", e.target.value)
                  }
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                  placeholder="Mã số thuế doanh nghiệp"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Dòng chữ bản quyền (Copyright text)
                </label>
                <input
                  type="text"
                  value={settings.footer?.copyrightText || ""}
                  onChange={(e) =>
                    handleInputChange("footer", "copyrightText", e.target.value)
                  }
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                  placeholder="© 2026 404Studio. All Rights Reserved."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebsiteSettingsManagement;
