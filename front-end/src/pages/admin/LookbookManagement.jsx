import React, { useState, useEffect } from "react";
import {
  adminGetPagesService,
  adminGetPageDetailService,
  adminCreatePageService,
  adminUpdatePageService,
  adminDeletePageService,
  adminToggleFeaturePageService,
} from "../../services/page.service";
import { SectionBuilder } from "../../components/admin/SectionBuilder";
import { uploadImageService } from "../../services/upload.service";
import {
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import useWebsiteSettings from "@/hooks/useWebsiteSettings";

const LookbookManagement = () => {
  const { settings } = useWebsiteSettings();
  const general = settings?.general || {};
  const siteName = general.siteName || "";
  useDocumentTitle("Quản lý lookbook");
  const [lookbooks, setLookbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Modal State
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [currentId, setCurrentId] = useState(null);

  // Tabs inside modal
  const [activeTab, setActiveTab] = useState("basic"); // "basic" | "sections"

  // Form Fields State (Metadata)
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formStatus, setFormStatus] = useState("draft");
  const [formSeoTitle, setFormSeoTitle] = useState("");
  const [formSeoDescription, setFormSeoDescription] = useState("");
  const [formSeoKeywords, setFormSeoKeywords] = useState("");
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formPublishedAt, setFormPublishedAt] = useState("");
  const [formThumbnailUrl, setFormThumbnailUrl] = useState("");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Relational Blocks state
  const [formSections, setFormSections] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Upload/Submit State
  const [submitting, setSubmitting] = useState(false);

  const pageStatuses = [
    { value: "draft", label: "Bản nháp" },
    { value: "published", label: "Đã xuất bản" },
    { value: "archived", label: "Lưu trữ" },
  ];

  // Fetch list of lookbooks
  const fetchLookbooks = async () => {
    try {
      setLoading(true);
      const res = await adminGetPagesService({
        ...filters,
        type: "lookbook",
      });
      setLookbooks(res.pages || []);
      setPagination({
        page: res.page || 1,
        limit: res.limit || 10,
        totalItems: res.total || 0,
        totalPages: res.totalPages || 1,
      });
    } catch (err) {
      toast.error("Không thể tải danh sách bộ sưu tập!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookbooks();
  }, [filters.page, filters.status]);

  // Handle Search Input delay
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLookbooks();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [filters.search]);

  // Handle auto-slug generation from title
  useEffect(() => {
    if (modalMode === "add" && formTitle) {
      const slug = formTitle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setFormSlug(slug);
    }
  }, [formTitle, modalMode]);

  const handleOpenAdd = () => {
    setModalMode("add");
    setCurrentId(null);
    setFormTitle("");
    setFormSlug("");
    setFormExcerpt("");
    setFormStatus("draft");
    setFormSeoTitle("");
    setFormSeoDescription("");
    setFormSeoKeywords("");
    setFormDisplayOrder(0);
    setFormPublishedAt("");
    setFormThumbnailUrl("");
    setSelectedProducts([]);
    setFormSections([]);
    setActiveTab("basic");
    setIsOpenModal(true);
  };

  const handleOpenEdit = async (lookbookObj) => {
    try {
      setModalMode("edit");
      setCurrentId(lookbookObj._id);

      toast.info("Đang tải chi tiết bộ sưu tập...");
      const res = await adminGetPageDetailService(lookbookObj._id);
      const page = res.page;
      const sections = res.sections || [];

      setFormTitle(page.title || "");
      setFormSlug(page.slug || "");
      setFormExcerpt(page.excerpt || "");
      setFormStatus(page.status || "draft");
      setFormSeoTitle(page.seoTitle || "");
      setFormSeoDescription(page.seoDescription || "");
      setFormSeoKeywords(page.seoKeywords || "");
      setFormDisplayOrder(page.displayOrder || 0);
      setFormThumbnailUrl(page.thumbnailUrl || page.bannerUrl || "");

      if (page.publishedAt) {
        setFormPublishedAt(
          new Date(page.publishedAt).toISOString().slice(0, 16),
        );
      } else {
        setFormPublishedAt("");
      }

      // Collect product details from sections to store in selectedProducts
      const productsMap = {};
      sections.forEach((sec) => {
        if (sec.type === "products" && sec.data?.products) {
          sec.data.products.forEach((p) => {
            productsMap[p._id] = p;
          });
        }
      });
      setSelectedProducts(Object.values(productsMap));
      setFormSections(sections);
      setActiveTab("basic");
      setIsOpenModal(true);
    } catch (error) {
      toast.error("Không thể tải chi tiết bộ sưu tập!");
    }
  };

  const handleDelete = async (id, title) => {
    try {
      const result = await Swal.fire({
        title: "Xóa Lookbook?",
        text: `Bạn có chắc chắn muốn xóa bộ sưu tập "${title}"? Thao tác này không thể hoàn tác.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#6B7280",
        confirmButtonText: "Đồng ý xóa",
        cancelButtonText: "Hủy bỏ",
      });

      if (result.isConfirmed) {
        await adminDeletePageService(id);
        toast.success("Xóa bộ sưu tập thành công!");
        fetchLookbooks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa bộ sưu tập thất bại!");
    }
  };

  const handleToggleFeature = async (id) => {
    try {
      await adminToggleFeaturePageService(id);
      toast.success("Cập nhật trạng thái nổi bật thành công!");
      fetchLookbooks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingThumbnail(true);
      const url = await uploadImageService(file);
      setFormThumbnailUrl(url);
      toast.success("Tải ảnh bìa thành công!");
    } catch (err) {
      console.error("Lỗi khi tải ảnh bìa:", err);
      toast.error("Tải ảnh bìa thất bại!");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      toast.error("Tiêu đề bộ sưu tập là bắt buộc");
      return;
    }
    if (!formSlug.trim()) {
      toast.error("Slug là bắt buộc");
      return;
    }

    // Prepare structured payload: { page: {...}, sections: [...] }
    const payload = {
      page: {
        title: formTitle,
        slug: formSlug,
        type: "lookbook",
        excerpt: formExcerpt,
        status: formStatus,
        seoTitle: formSeoTitle,
        seoDescription: formSeoDescription,
        seoKeywords: formSeoKeywords,
        displayOrder: Number(formDisplayOrder),
        publishedAt: formPublishedAt
          ? new Date(formPublishedAt).toISOString()
          : null,
        thumbnailUrl: formThumbnailUrl,
        bannerUrl: formThumbnailUrl,
      },
      sections: formSections,
    };

    try {
      setSubmitting(true);
      if (modalMode === "add") {
        await adminCreatePageService(payload);
        toast.success("Tạo bộ sưu tập thành công! 🚀");
      } else {
        await adminUpdatePageService(currentId, payload);
        toast.success("Cập nhật bộ sưu tập thành công!");
      }
      setIsOpenModal(false);
      fetchLookbooks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi lưu dữ liệu!");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 text-left relative text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            Quản lý Lookbook (Bộ sưu tập)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Thiết kế giao diện bộ sưu tập tạp chí, ảnh bìa, quote nghệ thuật,
            gallery sản phẩm nổi bật.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Tạo bộ sưu tập mới
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                search: e.target.value,
                page: 1,
              }))
            }
            placeholder="Tìm kiếm theo tiêu đề..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium text-gray-700"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
          }
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          {pageStatuses.map((st) => (
            <option key={st.value} value={st.value}>
              {st.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lookbook List Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-gray-100 animate-pulse flex items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-100 rounded w-20"></div>
            </div>
          ))}
        </div>
      ) : lookbooks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 p-8 shadow-xs">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800">
            Không tìm thấy bộ sưu tập nào
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Nhấn nút bên trên để tạo một bộ sưu tập Lookbook mới.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Ảnh bìa</th>
                  <th className="px-6 py-4">Tiêu đề & Slug</th>
                  <th className="px-6 py-4">Nổi bật</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Thứ tự hiển thị</th>
                  <th className="px-6 py-4">Lượt xem</th>
                  <th className="px-6 py-4">Ngày xuất bản</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {lookbooks.map((p) => {
                  const statusLabel =
                    pageStatuses.find((s) => s.value === p.status)?.label ||
                    p.status;

                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="w-14 h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                          {p.thumbnailUrl ? (
                            <img
                              src={p.thumbnailUrl}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-300 text-[10px] flex items-center justify-center h-full">
                              Không ảnh
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-gray-900">
                          {p.title}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                          {p.slug}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleFeature(p._id)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold cursor-pointer transition uppercase tracking-wider
                            ${
                              p.isFeatured
                                ? "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                            }`}
                        >
                          {p.isFeatured ? "Featured ★" : "Thường"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                          ${
                            p.status === "published"
                              ? "bg-green-50 text-green-700"
                              : p.status === "draft"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-505">
                        {p.displayOrder}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-750">
                        {p.viewCount || 0}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                        {formatDate(p.publishedAt || p.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {p.status === "published" && (
                          <a
                            href={`/lookbooks/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Xem trang công khai"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Chỉnh sửa bộ sưu tập"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id, p.title)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Xóa bộ sưu tập"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 px-6 py-4 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">
                Hiển thị trang {pagination.page} trên tổng{" "}
                {pagination.totalPages} ({pagination.totalItems} bộ sưu tập)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: Math.max(prev.page - 1, 1),
                    }))
                  }
                  disabled={pagination.page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Trước
                </button>
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: Math.min(prev.page + 1, pagination.totalPages),
                    }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-8 max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {modalMode === "add"
                    ? "Thêm Lookbook mới"
                    : "Chỉnh sửa Lookbook"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cấu hình các thông tin và bố cục khối tạp chí
                </p>
              </div>
              <button
                onClick={() => setIsOpenModal(false)}
                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-705 rounded-xl transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs Selector */}
            <div className="flex border-b border-gray-100 px-6 shrink-0 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition ${
                  activeTab === "basic"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                Thông tin cơ bản
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sections")}
                className={`px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition ${
                  activeTab === "sections"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-550 hover:text-gray-800"
                }`}
              >
                Bố cục bộ sưu tập
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: Basic Info Metadata */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Cover Image Upload (Left Column) */}
                    <div className="w-full md:w-1/3 space-y-2 text-left shrink-0">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                        Ảnh bìa bộ sưu tập
                      </label>
                      <div className="relative aspect-[2/3] w-full rounded-2xl bg-gray-50 border border-gray-200 hover:border-indigo-300 transition flex flex-col items-center justify-center overflow-hidden group">
                        {formThumbnailUrl ? (
                          <>
                            <img
                              src={formThumbnailUrl}
                              alt="Cover Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <label className="p-2 bg-white/95 hover:bg-white text-gray-700 rounded-xl shadow-md cursor-pointer transition">
                                <Upload className="h-4 w-4" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleThumbnailUpload}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setFormThumbnailUrl("")}
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md cursor-pointer transition"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-6 text-center cursor-pointer w-full h-full">
                            {uploadingThumbnail ? (
                              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            ) : (
                              <>
                                <ImageIcon className="h-10 w-10 text-gray-300 mb-2 group-hover:text-indigo-400 transition" />
                                <span className="text-xs text-gray-600 font-bold">
                                  Tải ảnh bìa
                                </span>
                                <span className="text-[10px] text-gray-400 mt-1">
                                  Tỉ lệ dọc (2:3) khuyên dùng
                                </span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleThumbnailUpload}
                              className="hidden"
                              disabled={uploadingThumbnail}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Form Fields (Right Column) */}
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Tiêu đề bộ sưu tập *
                          </label>
                          <input
                            type="text"
                            required
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="Ví dụ: BST Thu Đông 2026"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium"
                          />
                        </div>

                        {/* Slug */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Slug URL *
                          </label>
                          <input
                            type="text"
                            required
                            value={formSlug}
                            onChange={(e) => setFormSlug(e.target.value)}
                            placeholder="bst-thu-dong-2026"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-mono"
                          />
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Trạng thái xuất bản
                          </label>
                          <select
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-semibold text-gray-700 bg-white"
                          >
                            {pageStatuses.map((st) => (
                              <option key={st.value} value={st.value}>
                                {st.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Display Order */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Thứ tự hiển thị (displayOrder)
                          </label>
                          <input
                            type="number"
                            value={formDisplayOrder}
                            onChange={(e) =>
                              setFormDisplayOrder(Number(e.target.value))
                            }
                            placeholder="0"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium"
                          />
                        </div>

                        {/* Published At */}
                        <div className="space-y-1.5 text-left md:col-span-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Thời gian xuất bản
                          </label>
                          <input
                            type="datetime-local"
                            value={formPublishedAt}
                            onChange={(e) => setFormPublishedAt(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium text-gray-600 bg-white"
                          />
                        </div>
                      </div>

                      {/* Excerpt */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Mô tả ngắn / Slogan bộ sưu tập
                        </label>
                        <textarea
                          value={formExcerpt}
                          onChange={(e) => setFormExcerpt(e.target.value)}
                          placeholder="Mô tả phong cách, nét nghệ thuật của BST..."
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium h-20 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEO Block */}
                  <div className="space-y-4 pt-8 border-t border-gray-100 text-left">
                    <div className="flex items-center gap-2 text-indigo-700 font-black">
                      <Info className="h-4 w-4" />
                      <h4 className="text-xs uppercase tracking-wider">
                        Cấu hình SEO cho trang
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-550 uppercase tracking-wider">
                          Tiêu đề SEO
                        </label>
                        <input
                          type="text"
                          value={formSeoTitle}
                          onChange={(e) => setFormSeoTitle(e.target.value)}
                          placeholder="Mặc định lấy tiêu đề bộ sưu tập"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Từ khóa SEO
                        </label>
                        <input
                          type="text"
                          value={formSeoKeywords}
                          onChange={(e) => setFormSeoKeywords(e.target.value)}
                          placeholder="lookbook, ao thun, lookbook 2026"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Mô tả SEO
                      </label>
                      <textarea
                        value={formSeoDescription}
                        onChange={(e) => setFormSeoDescription(e.target.value)}
                        placeholder="Mô tả ngắn gọn dưới 160 kí tự phục vụ Google Search..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium h-20 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Dynamic PageSections Builder */}
              {activeTab === "sections" && (
                <SectionBuilder
                  sections={formSections}
                  setSections={setFormSections}
                  selectedProducts={selectedProducts}
                  setSelectedProducts={setSelectedProducts}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-3 shrink-0 select-none">
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="px-5 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {modalMode === "add" ? "Tạo bộ sưu tập" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LookbookManagement;
export { LookbookManagement };
