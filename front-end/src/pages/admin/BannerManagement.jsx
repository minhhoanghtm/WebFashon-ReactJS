import React, { useState } from "react";
import { useBanners } from "../../hooks/useBanners";
import { uploadImageService } from "../../services/upload.service";
import {
  Images,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";
import { toast } from "react-toastify";
import useWebsiteSettings from "@/hooks/useWebsiteSettings";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const BannerManagement = () => {
   const { settings } = useWebsiteSettings();
    const general = settings?.general || {};
    const siteName = general.siteName || "";
    useDocumentTitle("Quản lý banner");
  const {
    banners,
    loading,
    filters,
    setFilters,
    pagination,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
  } = useBanners();

  // Modal states
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [currentId, setCurrentId] = useState(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formMobileImageUrl, setFormMobileImageUrl] = useState("");
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formButtonText, setFormButtonText] = useState("");
  const [formPosition, setFormPosition] = useState("home_hero");
  const [formTargetType, setFormTargetType] = useState("external");
  const [formTargetId, setFormTargetId] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);

  // Upload states
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Helper formats
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setCurrentId(null);
    setFormTitle("");
    setFormSubtitle("");
    setFormImageUrl("");
    setFormMobileImageUrl("");
    setFormLinkUrl("");
    setFormButtonText("");
    setFormPosition("home_hero");
    setFormTargetType("external");
    setFormTargetId("");

    // Default dates: now to +30 days
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 30);

    setFormStartDate(now.toISOString().slice(0, 16));
    setFormEndDate(future.toISOString().slice(0, 16));
    setFormSortOrder(0);
    setFormIsActive(true);
    setIsOpenModal(true);
  };

  const handleOpenEdit = (banner) => {
    setModalMode("edit");
    setCurrentId(banner._id || banner.id);
    setFormTitle(banner.title);
    setFormSubtitle(banner.subtitle || "");
    setFormImageUrl(banner.imageUrl);
    setFormMobileImageUrl(banner.mobileImageUrl || "");
    setFormLinkUrl(banner.linkUrl || "");
    setFormButtonText(banner.buttonText || "");
    setFormPosition(banner.position);
    setFormTargetType(banner.targetType || "external");
    setFormTargetId(banner.targetId || "");
    setFormStartDate(banner.startDate ? banner.startDate.slice(0, 16) : "");
    setFormEndDate(banner.endDate ? banner.endDate.slice(0, 16) : "");
    setFormSortOrder(banner.sortOrder || 0);
    setFormIsActive(banner.isActive);
    setIsOpenModal(true);
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (type === "desktop") {
        setUploadingDesktop(true);
        const url = await uploadImageService(file);
        setFormImageUrl(url);
      } else {
        setUploadingMobile(true);
        const url = await uploadImageService(file);
        setFormMobileImageUrl(url);
      }
      toast.success("Tải ảnh banner lên thành công! 🖼️");
    } catch (err) {
      toast.error("Tải ảnh lên thất bại. Vui lòng thử lại!");
    } finally {
      setUploadingDesktop(false);
      setUploadingMobile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      toast.error("Tiêu đề banner là bắt buộc");
      return;
    }
    if (!formImageUrl.trim()) {
      toast.error("Vui lòng tải lên ảnh Desktop Banner");
      return;
    }
    if (!formStartDate || !formEndDate) {
      toast.error("Vui lòng chọn thời gian bắt đầu và kết thúc");
      return;
    }
    if (new Date(formStartDate) >= new Date(formEndDate)) {
      toast.error("Ngày kết thúc phải lớn hơn ngày bắt đầu");
      return;
    }

    if (formTargetType === "product" && !formTargetId.trim()) {
      toast.error("Mã sản phẩm liên kết (targetId) là bắt buộc");
      return;
    }
    if (formTargetType === "category" && !formTargetId.trim()) {
      toast.error("Mã danh mục liên kết (targetId) là bắt buộc");
      return;
    }
    if (formTargetType === "lookbook" && !formTargetId.trim()) {
      toast.error("Mã / Slug Lookbook liên kết (targetId) là bắt buộc");
      return;
    }
    // if (formTargetType === "external" && !formLinkUrl.trim()) {
    //   toast.error("Đường dẫn liên kết ngoài (linkUrl) là bắt buộc");
    //   return;
    // }

    const payload = {
      title: formTitle,
      subtitle: formSubtitle,
      imageUrl: formImageUrl,
      mobileImageUrl: formMobileImageUrl,
      linkUrl: formLinkUrl,
      buttonText: formButtonText,
      position: formPosition,
      targetType: formTargetType,
      targetId: formTargetId,
      startDate: new Date(formStartDate).toISOString(),
      endDate: new Date(formEndDate).toISOString(),
      sortOrder: Number(formSortOrder),
      isActive: formIsActive,
    };

    setSubmitting(true);
    let success = false;
    if (modalMode === "add") {
      success = await createBanner(payload);
    } else {
      success = await updateBanner(currentId, payload);
    }
    setSubmitting(false);

    if (success) {
      setIsOpenModal(false);
    }
  };

  // Positions selection list
  const bannerPositions = [
    { value: "home_hero", label: "Hero Banner Trang chủ" },
    { value: "home_lookbook", label: "Lookbook Banner" },
    { value: "home_promotion", label: "Khuyến mãi Banner" },
  ];

  return (
    <div className="space-y-6 text-left relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Quản lý Banner
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Lập lịch trình và thiết kế băng rôn, trình chiếu quảng cáo toàn
            trang
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Thêm Banner mới
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                keyword: e.target.value,
                page: 1,
              }))
            }
            placeholder="Tìm kiếm theo tiêu đề..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium text-gray-950"
          />
        </div>

        {/* Position Filter */}
        <select
          value={filters.position}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              position: e.target.value,
              page: 1,
            }))
          }
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
        >
          <option value="">Tất cả vị trí</option>
          {bannerPositions.map((pos) => (
            <option key={pos.value} value={pos.value}>
              {pos.label}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
          }
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang kích hoạt</option>
          <option value="false">Tạm ẩn</option>
        </select>
      </div>

      {/* Main Grid/Table list */}
      {loading ? (
        // Skeleton loading state
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-gray-100 animate-pulse flex items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-32 h-20 bg-gray-150 rounded-xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-155 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-150 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-150 rounded w-20"></div>
            </div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        // Empty state
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 p-8 shadow-xs">
          <Images className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800">
            Không tìm thấy banner
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Vui lòng thay đổi bộ lọc hoặc thêm một banner mới.
          </p>
        </div>
      ) : (
        // Banners List
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Bản xem trước</th>
                  <th className="px-6 py-4">Thông tin Banner</th>
                  <th className="px-6 py-4">Vị trí & Thứ tự</th>
                  <th className="px-6 py-4">Thời gian chạy</th>
                  <th className="px-6 py-4">Hiệu suất (Clicks)</th>
                  <th className="px-6 py-4 text-center">Kích hoạt</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                {banners.map((banner) => {
                  const isActivePosition =
                    bannerPositions.find((p) => p.value === banner.position)
                      ?.label || banner.position;
                  const now = new Date();
                  const isDateActive =
                    new Date(banner.startDate) <= now &&
                    new Date(banner.endDate) >= now;

                  return (
                    <tr
                      key={banner._id || banner.id}
                      className="hover:bg-slate-50/50 transition duration-150"
                    >
                      {/* Image Preview */}
                      <td className="px-6 py-4">
                        <div className="relative w-28 h-16 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 shrink-0 shadow-xs">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      {/* Information */}
                      <td className="px-6 py-4 max-w-[200px]">
                        <div className="font-bold text-gray-900 truncate">
                          {banner.title}
                        </div>
                        <div className="text-xs text-gray-400 truncate mt-0.5">
                          {banner.subtitle || "Không có phụ đề"}
                        </div>
                        <div className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded w-fit uppercase mt-1">
                          {banner.targetType}
                        </div>
                      </td>

                      {/* Position & Order */}
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-gray-600">
                          {isActivePosition}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Thứ tự: {banner.sortOrder || 0}
                        </div>
                      </td>

                      {/* Timeframe */}
                      <td className="px-6 py-4 text-xs space-y-1">
                        <div>
                          <span className="text-gray-400 font-semibold">
                            Từ:
                          </span>{" "}
                          {formatDateTime(banner.startDate)}
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold">
                            Đến:
                          </span>{" "}
                          {formatDateTime(banner.endDate)}
                        </div>
                        {!isDateActive && (
                          <div className="text-[9px] text-rose-500 font-bold bg-rose-50 px-1 rounded w-fit">
                            Ngoài khoảng thời gian
                          </div>
                        )}
                      </td>

                      {/* Clicks */}
                      <td className="px-6 py-4 font-mono font-bold text-gray-800">
                        {banner.clickCount || 0}
                      </td>

                      {/* Toggle Quick Status */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            toggleBannerStatus(banner._id || banner.id)
                          }
                          className="relative inline-flex items-center cursor-pointer justify-center align-middle"
                        >
                          <span className="sr-only">Toggle</span>
                          <div
                            className={`w-11 h-6 bg-gray-200 rounded-full transition-colors duration-200 relative
                            ${
                              banner.isActive ? "bg-indigo-600" : "bg-gray-250"
                            }`}
                          >
                            <div
                              className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-200
                              ${
                                banner.isActive
                                  ? "translate-x-5"
                                  : "translate-x-0"
                              }`}
                            />
                          </div>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(banner)}
                            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              deleteBanner(
                                banner._id || banner.id,
                                banner.title,
                              )
                            }
                            className="p-1.5 border border-red-100 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-750 cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold">
                Hiển thị trang {pagination.page} trên tổng{" "}
                {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  className="p-1.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  className="p-1.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Add/Edit Banner */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative text-left">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3.5 mb-5">
              <h2 className="text-lg font-black text-gray-900">
                {modalMode === "add"
                  ? "Thêm Banner Quảng cáo mới"
                  : "Chỉnh sửa Banner"}
              </h2>
              <button
                onClick={() => setIsOpenModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Tiêu đề Banner *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium text-black"
                    placeholder="Tiêu đề chính"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Phụ đề (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium text-black"
                    placeholder="Mô tả phụ ngắn"
                  />
                </div>
              </div>

              {/* Upload section with Desktop and Mobile image preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Desktop Image */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase block">
                    Ảnh Desktop Banner *
                  </label>
                  <div className="relative aspect-[16/9] w-full rounded-xl bg-gray-50 border border-gray-150 flex items-center justify-center overflow-hidden">
                    {formImageUrl ? (
                      <>
                        <img
                          src={formImageUrl}
                          alt="Desktop Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormImageUrl("")}
                          className="absolute top-2 right-2 bg-red-550 hover:bg-red-650 text-white rounded-full p-1 shadow-sm cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 text-center cursor-pointer w-full h-full">
                        {uploadingDesktop ? (
                          <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
                        ) : (
                          <>
                            <Upload className="h-7 w-7 text-gray-300 mb-1" />
                            <span className="text-xs text-gray-500 font-semibold">
                              Tải ảnh Desktop
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5">
                              Tỷ lệ rộng (16:9 / 21:9)
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "desktop")}
                          className="hidden"
                          disabled={uploadingDesktop}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Mobile Image */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase block">
                    Ảnh Mobile Banner
                  </label>
                  <div className="relative aspect-[16/9] md:aspect-square md:max-h-[145px] w-full rounded-xl bg-gray-50 border border-gray-150 flex items-center justify-center overflow-hidden">
                    {formMobileImageUrl ? (
                      <>
                        <img
                          src={formMobileImageUrl}
                          alt="Mobile Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormMobileImageUrl("")}
                          className="absolute top-2 right-2 bg-red-550 hover:bg-red-650 text-white rounded-full p-1 shadow-sm cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 text-center cursor-pointer w-full h-full">
                        {uploadingMobile ? (
                          <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
                        ) : (
                          <>
                            <Upload className="h-7 w-7 text-gray-300 mb-1" />
                            <span className="text-xs text-gray-500 font-semibold">
                              Tải ảnh Mobile
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5">
                              Tỷ lệ đứng hoặc vuông (1:1 / 4:5)
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "mobile")}
                          className="hidden"
                          disabled={uploadingMobile}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Position, ButtonText, SortOrder */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Vị trí hiển thị *
                  </label>
                  <select
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-semibold text-gray-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    {bannerPositions.map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Chữ nút (Button text)
                  </label>
                  <input
                    type="text"
                    value={formButtonText}
                    onChange={(e) => setFormButtonText(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium text-black"
                    placeholder="Ví dụ: Mua ngay, Xem thêm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Thứ tự hiển thị (sortOrder)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium text-black"
                  />
                </div>
              </div>

              {/* Target Type, LinkUrl / TargetId */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-50">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Kiểu liên kết *
                  </label>
                  <select
                    value={formTargetType}
                    onChange={(e) => setFormTargetType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-semibold text-gray-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="external">Liên kết ngoài (URL)</option>
                    <option value="product">Sản phẩm cụ thể</option>
                    <option value="category">Danh mục sản phẩm</option>
                    <option value="lookbook">Bộ sưu tập (Lookbook)</option>
                  </select>
                </div>

                {formTargetType === "external" ? (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Đường dẫn liên kết ngoài (linkUrl)
                    </label>
                    <input
                      type="text"
                      // required
                      value={formLinkUrl}
                      onChange={(e) => setFormLinkUrl(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium text-black"
                      placeholder="https://..."
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Mã định danh liên kết (targetId) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTargetId}
                      onChange={(e) => setFormTargetId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium"
                      placeholder={
                        formTargetType === "product"
                          ? "Nhập ID sản phẩm"
                          : formTargetType === "category"
                          ? "Nhập ID danh mục"
                          : "Nhập Slug hoặc ID của Lookbook"
                      }
                    />
                  </div>
                )}
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Thời gian chạy *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium text-black"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Thời gian kết thúc *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium text-black"
                  />
                </div>
              </div>

              {/* Toggle active state */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4.5 w-4.5 text-indigo-650 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="formIsActive"
                  className="text-sm font-bold text-gray-700 cursor-pointer selection:bg-transparent"
                >
                  Kích hoạt hiển thị ngay lập tức
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={submitting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>
                    {modalMode === "add" ? "Thêm mới" : "Lưu thay đổi"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;
