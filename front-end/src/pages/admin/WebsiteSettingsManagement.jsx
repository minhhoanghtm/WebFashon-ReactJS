import React, { useState } from "react";
import { useWebsiteSettings } from "../../hooks/useWebsiteSettings";
import { uploadImageService } from "../../services/upload.service";
import {
  Settings,
  Sliders,
  Share2,
  Building2,
  Save,
  RefreshCw,
  Upload,
  Loader2,
  AlertCircle,
  Phone,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import HeadquartersAddressPicker from "@/components/admin/HeadquartersAddressPicker";
import { AdminPageHeader, AdminCard, CardSkeleton } from "@/components/admin/ui";

const WebsiteSettingsManagement = () => {
  useDocumentTitle("Cài đặt website — Quản trị");
  const {
    settings,
    setSettings,
    loading,
    saving,
    isDirty,
    updateSettings,
    reload,
  } = useWebsiteSettings();

  const [activeTab, setActiveTab] = useState("general");
  const [uploadingField, setUploadingField] = useState(null);

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Cài đặt hệ thống"
          subtitle="Đang tải dữ liệu cấu hình..."
          breadcrumbs={[{ label: "Cài đặt website" }]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <CardSkeleton rows={5} />
          </div>
          <div className="lg:col-span-3">
            <CardSkeleton rows={8} />
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Cài đặt hệ thống"
          subtitle="Cấu hình hệ thống và thông tin website"
          breadcrumbs={[{ label: "Cài đặt website" }]}
        />
        <AdminCard className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Không thể tải cài đặt hệ thống
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Vui lòng kiểm tra lại kết nối mạng hoặc phiên đăng nhập quản trị viên của bạn.
          </p>
          <button
            onClick={reload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại dữ liệu
          </button>
        </AdminCard>
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
      toast.success("Tải lên hình ảnh thành công!");
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
      toast.success("Đã lưu và đồng bộ cài đặt website!");
    }
  };

  const tabs = [
    {
      id: "general",
      label: "Cài đặt chung",
      description: "Tên thương hiệu, mô tả & logo",
      icon: Settings,
    },
    {
      id: "contact",
      label: "Trụ sở & Liên hệ",
      description: "Hotline, email & địa chỉ kho",
      icon: Phone,
    },
    {
      id: "seo",
      label: "Cấu hình SEO & Meta",
      description: "Thẻ tiêu đề, từ khóa & OG image",
      icon: Search,
    },
    {
      id: "system",
      label: "Tính năng hệ thống",
      description: "Bảo trì, checkout & voucher",
      icon: Sliders,
    },
    {
      id: "social",
      label: "Mạng xã hội & Scripts",
      description: "Social links, GTM & Pixel",
      icon: Share2,
    },
    {
      id: "footer",
      label: "Chân trang & Pháp lý",
      description: "Doanh nghiệp, MST & bản quyền",
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <AdminPageHeader
        title="Cài đặt hệ thống"
        subtitle="Cấu hình nhận diện thương hiệu, thông tin liên hệ, SEO, mạng xã hội và chân trang"
        breadcrumbs={[{ label: "Cài đặt website" }]}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={reload}
              disabled={saving}
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              title="Khôi phục về trạng thái gần nhất"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Tải lại</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Lưu thay đổi</span>
            </button>
          </div>
        }
      />

      {/* Floating Unsaved Changes Alert Bar */}
      {isDirty && (
        <div className="sticky top-20 z-20 flex items-center justify-between p-3.5 px-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl shadow-sm text-sm text-amber-900 dark:text-amber-200 transition-all">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-medium">
              Bạn có một số thay đổi cấu hình chưa được lưu.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {saving ? "Đang lưu..." : "Lưu ngay"}
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Navigation + Right Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Vertical Navigation Menu */}
        <div className="lg:col-span-4">
          <AdminCard className="p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-start gap-3 p-3 text-left rounded-xl transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[#05251C]/10 text-[#05251C] dark:bg-[#F5DD20]/15 dark:text-[#F5DD20] font-medium"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 mt-0.5 shrink-0 ${
                      isActive ? "text-[#05251C] dark:text-[#F5DD20]" : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{tab.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </AdminCard>
        </div>

        {/* Right Settings Form Content */}
        <div className="lg:col-span-8">
          <AdminCard className="p-6">
            {/* TAB: GENERAL */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Cài đặt chung
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Thông tin hiển thị nhận diện thương hiệu trên header và giao diện người dùng
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tên Website / Thương hiệu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settings.general?.siteName || ""}
                      onChange={(e) =>
                        handleInputChange("general", "siteName", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                      placeholder="Ví dụ: 404Studio Fashion"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Giờ làm việc & Hỗ trợ
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
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                      placeholder="Ví dụ: 08:30 - 21:30 hàng ngày"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Khẩu hiệu / Giới thiệu ngắn
                  </label>
                  <textarea
                    rows={3}
                    value={settings.general?.siteDescription || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "general",
                        "siteDescription",
                        e.target.value,
                      )
                    }
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20] resize-none"
                    placeholder="Mô tả tóm tắt về phong cách và định hướng sản phẩm của thương hiệu..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Logo Website (Khuyến nghị định dạng PNG hoặc SVG)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center overflow-hidden shrink-0 p-2">
                        {settings.general?.logoUrl ? (
                          <img
                            src={settings.general.logoUrl}
                            alt="Logo preview"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">Chưa có logo</span>
                        )}
                      </div>
                      <div>
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer">
                          {uploadingField === "logoUrl" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-[#05251C] dark:text-[#F5DD20]" />
                          ) : (
                            <Upload className="h-4 w-4 text-slate-500" />
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
                        <p className="text-[11px] text-slate-400 mt-1.5">
                          Kích thước đề xuất: 240 × 60 px
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Favicon Upload */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Favicon (Icon tab trình duyệt)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center overflow-hidden shrink-0 p-2">
                        {settings.general?.faviconUrl ? (
                          <img
                            src={settings.general.faviconUrl}
                            alt="Favicon preview"
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">Chưa có icon</span>
                        )}
                      </div>
                      <div>
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer">
                          {uploadingField === "faviconUrl" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-[#05251C] dark:text-[#F5DD20]" />
                          ) : (
                            <Upload className="h-4 w-4 text-slate-500" />
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
                        <p className="text-[11px] text-slate-400 mt-1.5">
                          Kích thước đề xuất: 32 × 32 px hoặc 64 × 64 px
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CONTACT */}
            {activeTab === "contact" && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Thông tin liên hệ & Địa chỉ trụ sở
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Địa chỉ và hotline dùng cho hóa đơn, liên hệ hỗ trợ và tính toán giao nhận hàng
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Số Hotline bán hàng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settings.general?.hotline || ""}
                      onChange={(e) =>
                        handleInputChange("general", "hotline", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                      placeholder="Ví dụ: 0987 654 321"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Email hỗ trợ khách hàng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={settings.general?.email || ""}
                      onChange={(e) =>
                        handleInputChange("general", "email", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                      placeholder="support@404studio.vn"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Địa chỉ kho hàng / Trụ sở chính <span className="text-rose-500">*</span>
                  </label>
                  <HeadquartersAddressPicker
                    value={settings.general?.address || ""}
                    onChange={(addr) =>
                      handleInputChange("general", "address", addr)
                    }
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Địa chỉ này sẽ dùng để tính điểm gửi kho và xuất phát hàng cho các đơn vị vận chuyển GHN.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: SEO */}
            {activeTab === "seo" && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Cấu hình SEO & Mạng xã hội (Open Graph)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Tối ưu hóa khả năng hiển thị trên Google Search, Facebook, Zalo khi người dùng chia sẻ link
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Thẻ tiêu đề SEO mặc định (Meta Title)
                  </label>
                  <input
                    type="text"
                    value={settings.seo?.metaTitle || ""}
                    onChange={(e) =>
                      handleInputChange("seo", "metaTitle", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                    placeholder="404Studio — Thời trang tối giản & hiện đại"
                  />
                  <p className="text-[11px] text-slate-400">
                    Số ký tự khuyến nghị: 50 – 60 ký tự. Hiện tại: {settings.seo?.metaTitle?.length || 0} ký tự.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Từ khóa tìm kiếm (Meta Keywords, phân cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={settings.seo?.metaKeywords || ""}
                    onChange={(e) =>
                      handleInputChange("seo", "metaKeywords", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                    placeholder="thời trang nam, áo sơ mi, quần tây, 404studio"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mô tả SEO mặc định (Meta Description)
                  </label>
                  <textarea
                    rows={3}
                    value={settings.seo?.metaDescription || ""}
                    onChange={(e) =>
                      handleInputChange("seo", "metaDescription", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20] resize-none"
                    placeholder="Khám phá bộ sưu tập thời trang thiết kế tối giản, chất liệu cao cấp tại 404Studio..."
                  />
                  <p className="text-[11px] text-slate-400">
                    Số ký tự khuyến nghị: 120 – 160 ký tự. Hiện tại: {settings.seo?.metaDescription?.length || 0} ký tự.
                  </p>
                </div>

                {/* OG Image Upload */}
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ảnh xem trước khi chia sẻ mạng xã hội (OG Image)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-36 h-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                      {settings.seo?.ogImage ? (
                        <img
                          src={settings.seo.ogImage}
                          alt="OG Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">1200 × 630 px</span>
                      )}
                    </div>
                    <div>
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer">
                        {uploadingField === "ogImage" ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[#05251C] dark:text-[#F5DD20]" />
                        ) : (
                          <Upload className="h-4 w-4 text-slate-500" />
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
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Tỷ lệ chuẩn 1.91:1 (Kích thước 1200 × 630 px)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SYSTEM */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Tính năng & Cơ chế vận hành
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Bật tắt nhanh các luồng nghiệp vụ trên toàn bộ hệ thống bán hàng
                  </p>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Chế độ bảo trì hệ thống
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tạm dừng giao diện storefront để nâng cấp máy chủ hoặc cập nhật dữ liệu lớn
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
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#05251C] dark:peer-checked:bg-[#F5DD20]"></div>
                    </label>
                  </div>

                  {/* Allow Guest Checkout */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Mua hàng không cần đăng nhập (Guest Checkout)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Cho phép khách mua sắm và hoàn tất đơn hàng bằng thông tin số điện thoại mà không cần mật khẩu
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
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#05251C] dark:peer-checked:bg-[#F5DD20]"></div>
                    </label>
                  </div>

                  {/* Enable Voucher */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Mã giảm giá & Khuyến mãi (Voucher)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Hiển thị ô áp dụng voucher và tính giảm giá trực tiếp tại bước thanh toán
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
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#05251C] dark:peer-checked:bg-[#F5DD20]"></div>
                    </label>
                  </div>

                  {/* Enable Reviews */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Đánh giá & Nhận xét sản phẩm
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Cho phép khách hàng đã mua và nhận hàng đánh giá sao kèm hình ảnh thực tế
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
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#05251C] dark:peer-checked:bg-[#F5DD20]"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SOCIAL & INTEGRATIONS */}
            {activeTab === "social" && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Mạng xã hội & Tích hợp phân tích
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Liên kết các kênh mạng xã hội chính thức và gắn mã theo dõi tiếp thị
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Liên kết kênh truyền thông
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Facebook Fanpage URL
                      </label>
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
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                        placeholder="https://facebook.com/404studio"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Instagram Profile URL
                      </label>
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
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                        placeholder="https://instagram.com/404studio"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        TikTok Channel URL
                      </label>
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
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                        placeholder="https://tiktok.com/@404studio"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        YouTube Channel URL
                      </label>
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
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                        placeholder="https://youtube.com/@404studio"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Zalo OA / Hotline Zalo
                      </label>
                      <input
                        type="text"
                        value={settings.socialLinks?.zalo || ""}
                        onChange={(e) =>
                          handleInputChange("socialLinks", "zalo", e.target.value)
                        }
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                        placeholder="Số điện thoại hoặc link Zalo Official Account"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Mã tích hợp & Đo lường
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Google Tag Manager ID
                      </label>
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
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                        placeholder="GTM-XXXXXXX"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Google Analytics 4 ID (Measurement ID)
                      </label>
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
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                        placeholder="G-XXXXXXXXXX"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Facebook Pixel ID
                      </label>
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
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                        placeholder="Ví dụ: 123456789012345"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Mã nhúng hỗ trợ trực tuyến / Chatbot
                      </label>
                      <textarea
                        rows={3}
                        value={settings.integrations?.chatbotScript || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "integrations",
                            "chatbotScript",
                            e.target.value,
                          )
                        }
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20] resize-none"
                        placeholder="<!-- Dán đoạn mã script nhúng widget chat tại đây -->"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: FOOTER */}
            {activeTab === "footer" && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Thông tin chân trang & Pháp lý doanh nghiệp
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Hiển thị ở khu vực footer cuối trang theo quy định về thương mại điện tử
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tên công ty chủ quản
                  </label>
                  <input
                    type="text"
                    value={settings.footer?.companyName || ""}
                    onChange={(e) =>
                      handleInputChange("footer", "companyName", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                    placeholder="Công ty Cổ phần Thời trang 404Studio"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Mã số thuế doanh nghiệp (MST / ĐKKD)
                    </label>
                    <input
                      type="text"
                      value={settings.footer?.taxCode || ""}
                      onChange={(e) =>
                        handleInputChange("footer", "taxCode", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                      placeholder="0123456789"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Dòng chữ bản quyền (Copyright)
                    </label>
                    <input
                      type="text"
                      value={settings.footer?.copyrightText || ""}
                      onChange={(e) =>
                        handleInputChange("footer", "copyrightText", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#05251C] focus:ring-1 focus:ring-[#05251C] dark:focus:border-[#F5DD20] dark:focus:ring-[#F5DD20]"
                      placeholder="© 2026 404Studio. All Rights Reserved."
                    />
                  </div>
                </div>
              </div>
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  );
};

export default WebsiteSettingsManagement;