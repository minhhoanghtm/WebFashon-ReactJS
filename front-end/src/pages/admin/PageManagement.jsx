import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  adminGetPagesService,
  adminGetPageByIdService,
  adminCreatePageService,
  adminUpdatePageService,
  adminDeletePageService,
} from "../../services/page.service";
import { suggestProductsService } from "../../services/product.service";
import { uploadImageService } from "../../services/upload.service";
import {
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Upload,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  ChevronUp,
  ChevronDown,
  Layout,
  Move,
} from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const PageManagement = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    type: "",
    status: "",
    excludeType: "lookbook",
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
  const [formType, setFormType] = useState("about");

  const typeToPageDetails = {
    about: { title: "Giới thiệu (About Us)", slug: "about" },
    policy: { title: "Chính sách (Policy)", slug: "policy" },
    faq: { title: "Hỏi đáp (FAQ)", slug: "faq" },
    guide: { title: "Hướng dẫn mua hàng", slug: "guide" },
    landing: { title: "Trang Landing", slug: "landing" },
    blog: { title: "Blog / Tin tức", slug: "blog" },
  };
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formContent, setFormContent] = useState(""); // Still used for basic rich text for non-lookbooks
  const [formStatus, setFormStatus] = useState("draft");
  const [formSeoTitle, setFormSeoTitle] = useState("");
  const [formSeoDescription, setFormSeoDescription] = useState("");
  const [formSeoKeywords, setFormSeoKeywords] = useState("");
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formPublishedAt, setFormPublishedAt] = useState("");

  // Relational Blocks state
  const [formSections, setFormSections] = useState([]);

  // Product Selection State (for lookbook type)
  const [productSearch, setProductSearch] = useState("");
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [activeProductSectionIdx, setActiveProductSectionIdx] = useState(null);

  // Section builder states
  const [newSectionType, setNewSectionType] = useState("hero");

  // Upload/Submit State
  const [submitting, setSubmitting] = useState(false);

  const pageTypes = [
    { value: "about", label: "Giới thiệu (About Us)" },
    { value: "policy", label: "Chính sách (Policy)" },
    { value: "faq", label: "Hỏi đáp (FAQ)" },
    { value: "guide", label: "Hướng dẫn mua hàng" },
    { value: "landing", label: "Trang Landing" },
    { value: "blog", label: "Blog / Tin tức" },
  ];

  const pageStatuses = [
    { value: "draft", label: "Bản nháp" },
    { value: "published", label: "Đã xuất bản" },
    { value: "archived", label: "Lưu trữ" },
  ];

  const sectionTypesList = [
    { value: "hero", label: "Khối Hero" },
    { value: "story", label: "Câu chuyện văn bản" },
    { value: "gallery", label: "Thư viện ảnh biên tập" },
    { value: "quote", label: "Trích dẫn thời trang" },
    { value: "image_text", label: "Ảnh + Văn bản" },
    { value: "products", label: "Sản phẩm nổi bật" },
    { value: "banner", label: "Banner toàn chiều rộng" },
    { value: "cta", label: "Khối CTA kết thúc" },
  ];

  // Fetch list of pages
  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await adminGetPagesService(filters);
      setPages(res.pages || []);
      setPagination({
        page: res.page || 1,
        limit: res.limit || 10,
        totalItems: res.total || 0,
        totalPages: res.totalPages || 1,
      });
    } catch (err) {
      toast.error("Không thể tải danh sách các trang nội dung!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [filters.page, filters.type, filters.status]);

  // Handle Search Input delay
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPages();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [filters.search]);

  // Handle tying title and slug directly to formType
  useEffect(() => {
    if (typeToPageDetails[formType]) {
      setFormTitle(typeToPageDetails[formType].title);
      setFormSlug(typeToPageDetails[formType].slug);
    }
  }, [formType]);

  // Handle Product Suggestions Query
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!productSearch.trim()) {
        setProductSuggestions([]);
        return;
      }
      try {
        setSearchingProducts(true);
        const res = await suggestProductsService(productSearch);
        const results = Array.isArray(res) ? res : res?.data ?? [];
        setProductSuggestions(results.slice(0, 5));
      } catch (error) {
        console.error("Lỗi khi tìm gợi ý sản phẩm:", error);
      } finally {
        setSearchingProducts(false);
      }
    };

    const delay = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(delay);
  }, [productSearch]);

  const handleAddProduct = (product) => {
    if (activeProductSectionIdx !== null) {
      const idx = activeProductSectionIdx;
      const nextSecs = [...formSections];
      const productIds = nextSecs[idx].data.productIds || [];
      if (productIds.includes(product._id)) {
        toast.warning("Sản phẩm đã tồn tại trong khối này!");
        return;
      }
      nextSecs[idx].data.productIds = [...productIds, product._id];

      // Keep product details loaded in memory
      if (!selectedProducts.some((p) => p._id === product._id)) {
        setSelectedProducts([...selectedProducts, product]);
      }

      setFormSections(nextSecs);
      setProductSearch("");
      setProductSuggestions([]);
      setActiveProductSectionIdx(null);
      toast.success("Thêm sản phẩm thành công!");
    }
  };

  const handleRemoveProductFromSection = (secIdx, productId) => {
    const nextSecs = [...formSections];
    const productIds = nextSecs[secIdx].data.productIds || [];
    nextSecs[secIdx].data.productIds = productIds.filter(
      (id) => id !== productId,
    );
    setFormSections(nextSecs);
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setCurrentId(null);
    setFormTitle(typeToPageDetails.about.title);
    setFormSlug(typeToPageDetails.about.slug);
    setFormType("about");
    setFormExcerpt("");
    setFormContent("");
    setFormStatus("draft");
    setFormSeoTitle("");
    setFormSeoDescription("");
    setFormSeoKeywords("");
    setFormDisplayOrder(0);
    setFormPublishedAt("");
    setSelectedProducts([]);
    setFormSections([]);
    setActiveTab("basic");
    setIsOpenModal(true);
  };

  const handleOpenEdit = async (pageObj) => {
    try {
      setModalMode("edit");
      setCurrentId(pageObj._id);

      toast.info("Đang tải dữ liệu trang...");
      const page = await adminGetPageByIdService(pageObj._id);

      setFormTitle(page.title || "");
      setFormSlug(page.slug || "");
      setFormType(page.type || "about");
      setFormExcerpt(page.excerpt || "");
      setFormContent(page.content || "");
      setFormStatus(page.status || "draft");
      setFormSeoTitle(page.seoTitle || "");
      setFormSeoDescription(page.seoDescription || "");
      setFormSeoKeywords(page.seoKeywords || "");
      setFormDisplayOrder(page.displayOrder || 0);

      if (page.publishedAt) {
        setFormPublishedAt(
          new Date(page.publishedAt).toISOString().slice(0, 16),
        );
      } else {
        setFormPublishedAt("");
      }

      setSelectedProducts(page.relatedProducts || []);
      setFormSections(page.sections || []);
      setActiveTab("basic");
      setIsOpenModal(true);
    } catch (error) {
      toast.error("Không thể tải chi tiết trang cần chỉnh sửa!");
    }
  };

  const handleDelete = async (id, title) => {
    try {
      const result = await Swal.fire({
        title: "Xóa trang CMS?",
        text: `Bạn có chắc chắn muốn xóa trang "${title}"? Thao tác này không thể hoàn tác.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#6B7280",
        confirmButtonText: "Đồng ý xóa",
        cancelButtonText: "Hủy bỏ",
      });

      if (result.isConfirmed) {
        await adminDeletePageService(id);
        toast.success("Xóa trang nội dung thành công!");
        fetchPages();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa trang thất bại!");
    }
  };

  // Section block operations
  const handleAddSection = () => {
    let defaultData = {};
    const type = newSectionType;
    if (type === "hero") {
      defaultData = {
        title: "",
        subtitle: "",
        description: "",
        coverImage: "",
        buttonText: "",
        buttonLink: "",
      };
    } else if (type === "story") {
      defaultData = { heading: "", content: "" };
    } else if (type === "gallery") {
      defaultData = { images: [] };
    } else if (type === "quote") {
      defaultData = { quote: "", author: "" };
    } else if (type === "image_text") {
      defaultData = {
        image: "",
        title: "",
        content: "",
        imagePosition: "left",
      };
    } else if (type === "products") {
      defaultData = { productIds: [] };
    } else if (type === "banner") {
      defaultData = {
        image: "",
        title: "",
        subtitle: "",
        buttonText: "",
        buttonLink: "",
      };
    } else if (type === "cta") {
      defaultData = {
        title: "",
        description: "",
        buttonText: "",
        buttonLink: "",
      };
    }

    setFormSections([
      ...formSections,
      { type, order: formSections.length, isActive: true, data: defaultData },
    ]);
    toast.success("Đã thêm khối nội dung mới!");
  };

  const handleRemoveSection = (idx) => {
    const nextSecs = formSections
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, order: i }));
    setFormSections(nextSecs);
  };

  const handleMoveSection = (idx, direction) => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === formSections.length - 1) return;

    const nextIdx = direction === "up" ? idx - 1 : idx + 1;
    const nextSecs = [...formSections];
    const temp = nextSecs[idx];
    nextSecs[idx] = nextSecs[nextIdx];
    nextSecs[nextIdx] = temp;

    // Recalculate order indices
    nextSecs.forEach((s, i) => {
      s.order = i;
    });

    setFormSections(nextSecs);
  };

  const handleUpdateSectionData = (idx, key, value) => {
    const nextSecs = [...formSections];
    nextSecs[idx].data = { ...nextSecs[idx].data, [key]: value };
    setFormSections(nextSecs);
  };

  const handleSectionImageUpload = async (e, idx, key) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Đang tải ảnh...");
      const url = await uploadImageService(file);
      handleUpdateSectionData(idx, key, url);
      toast.success("Tải ảnh thành công!");
    } catch (err) {
      toast.error("Tải ảnh thất bại!");
    }
  };

  // Gallery array helpers
  const handleAddGalleryImage = (idx) => {
    const nextSecs = [...formSections];
    const nextImages = [...(nextSecs[idx].data.images || [])];
    nextImages.push({ imageUrl: "", caption: "" });
    nextSecs[idx].data.images = nextImages;
    setFormSections(nextSecs);
  };

  const handleRemoveGalleryImage = (idx, imgIdx) => {
    const nextSecs = [...formSections];
    const nextImages = [...(nextSecs[idx].data.images || [])].filter(
      (_, i) => i !== imgIdx,
    );
    nextSecs[idx].data.images = nextImages;
    setFormSections(nextSecs);
  };

  const handleMoveGalleryImage = (idx, imgIdx, direction) => {
    const nextSecs = [...formSections];
    const nextImages = [...(nextSecs[idx].data.images || [])];
    if (direction === "up" && imgIdx === 0) return;
    if (direction === "down" && imgIdx === nextImages.length - 1) return;

    const nextIdx = direction === "up" ? imgIdx - 1 : imgIdx + 1;
    const temp = nextImages[imgIdx];
    nextImages[imgIdx] = nextImages[nextIdx];
    nextImages[nextIdx] = temp;

    nextSecs[idx].data.images = nextImages;
    setFormSections(nextSecs);
  };

  const handleUpdateGalleryImageField = (idx, imgIdx, key, value) => {
    const nextSecs = [...formSections];
    const nextImages = [...(nextSecs[idx].data.images || [])];
    nextImages[imgIdx] = { ...nextImages[imgIdx], [key]: value };
    nextSecs[idx].data.images = nextImages;
    setFormSections(nextSecs);
  };

  const handleGalleryImageUpload = async (e, idx, imgIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Đang tải ảnh...");
      const url = await uploadImageService(file);
      handleUpdateGalleryImageField(idx, imgIdx, "imageUrl", url);
      toast.success("Tải ảnh thành công!");
    } catch (err) {
      toast.error("Tải ảnh thất bại!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      toast.error("Tiêu đề trang là bắt buộc");
      return;
    }
    if (!formSlug.trim()) {
      toast.error("Slug của trang là bắt buộc");
      return;
    }

    const payload = {
      title: formTitle,
      slug: formSlug,
      type: formType,
      excerpt: formExcerpt,
      content: "",
      status: formStatus,
      seoTitle: formSeoTitle,
      seoDescription: formSeoDescription,
      seoKeywords: formSeoKeywords,
      displayOrder: Number(formDisplayOrder),
      publishedAt: formPublishedAt
        ? new Date(formPublishedAt).toISOString()
        : null,
      sections: formSections,
    };

    try {
      setSubmitting(true);
      if (modalMode === "add") {
        await adminCreatePageService(payload);
        toast.success("Tạo trang nội dung mới thành công! 🚀");
      } else {
        await adminUpdatePageService(currentId, payload);
        toast.success("Cập nhật trang thành công!");
      }
      setIsOpenModal(false);
      fetchPages();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Thao tác thất bại. Vui lòng kiểm tra lại!",
      );
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
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Quản lý trang CMS
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các trang thông tin tĩnh, chính sách hỗ trợ, hỏi đáp (FAQ),
            và bộ sưu tập thời trang (Lookbook).
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-200 text-black text-sm font-bold rounded-xl shadow-md hover:scale-102 active:scale-98 transition cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          Thêm trang mới
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-wrap gap-4 items-center">
        {/* Search */}
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

        {/* Type Filter */}
        <select
          value={filters.type}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, type: e.target.value, page: 1 }))
          }
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
        >
          <option value="">Tất cả loại trang</option>
          {pageTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
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
          {pageStatuses.map((st) => (
            <option key={st.value} value={st.value}>
              {st.label}
            </option>
          ))}
        </select>
      </div>

      {/* Pages List */}
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
      ) : pages.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 p-8 shadow-xs">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800">
            Không tìm thấy trang nào
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Vui lòng thay đổi bộ lọc hoặc thêm một trang nội dung mới.
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
                  <th className="px-6 py-4">Loại trang</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Lượt xem</th>
                  <th className="px-6 py-4">Thứ tự</th>
                  <th className="px-6 py-4">Ngày xuất bản</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {pages.map((p) => {
                  const typeLabel =
                    pageTypes.find((t) => t.value === p.type)?.label || p.type;
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">
                          {typeLabel}
                        </span>
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
                      <td className="px-6 py-4 font-bold text-gray-700">
                        {p.viewCount || 0}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono">
                        {p.displayOrder}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                        {formatDate(p.publishedAt || p.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {p.status === "published" && (
                          <a
                            href={p.type === "lookbook" ? `/lookbooks/${p.slug}` : `/${p.slug}`}
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
                          title="Sửa trang"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id, p.title)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Xóa trang"
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
                {pagination.totalPages} ({pagination.totalItems} trang)
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
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-8 h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {modalMode === "add"
                    ? "Thêm trang CMS mới"
                    : "Chỉnh sửa trang CMS"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cấu hình các thông tin và bố cục khối nội dung
                </p>
              </div>
              <button
                onClick={() => setIsOpenModal(false)}
                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-xl transition cursor-pointer"
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
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                Bố cục trang
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0">
              {/* TAB 1: Basic Info Metadata */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Page Type */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Loại trang CMS
                      </label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-semibold text-gray-700 bg-white"
                      >
                        {pageTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
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
                    <div className="space-y-1.5 text-left">
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
                      Tóm tắt / Mô tả ngắn
                    </label>
                    <textarea
                      value={formExcerpt}
                      onChange={(e) => setFormExcerpt(e.target.value)}
                      placeholder="Viết một đoạn tóm tắt ngắn..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium h-20 resize-none"
                    />
                  </div>

                  {/* SEO Block */}
                  <div className="space-y-4 pt-8 border-t border-gray-100 text-left">
                    <div>
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                        Cấu hình SEO cho trang
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Cấu hình các thẻ META để trang dễ dàng lập chỉ mục trên
                        Google.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* SEO Title */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Tiêu đề SEO
                        </label>
                        <input
                          type="text"
                          value={formSeoTitle}
                          onChange={(e) => setFormSeoTitle(e.target.value)}
                          placeholder="Nếu trống sẽ lấy tiêu đề trang"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium"
                        />
                      </div>

                      {/* SEO Keywords */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Từ khóa SEO
                        </label>
                        <input
                          type="text"
                          value={formSeoKeywords}
                          onChange={(e) => setFormSeoKeywords(e.target.value)}
                          placeholder="ao thun, thoi trang nam, lookbook"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium"
                        />
                      </div>
                    </div>

                    {/* SEO Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Mô tả SEO
                      </label>
                      <textarea
                        value={formSeoDescription}
                        onChange={(e) => setFormSeoDescription(e.target.value)}
                        placeholder="Mô tả tóm tắt nội dung trang dưới 160 ký tự..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm font-medium h-20 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Dynamic PageSections Builder */}
              {activeTab === "sections" && (
                <div className="space-y-8 text-left">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <div>
                      <h4 className="text-sm font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Layout className="h-4.5 w-4.5" />
                        Xây dựng bố cục trang CMS
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Thêm, bớt, chỉnh sửa và kéo thả/sắp xếp thứ tự các khối
                        nội dung hiển thị trong trang CMS này.
                      </p>
                    </div>
                  </div>

                  {/* Sections List */}
                  {formSections.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-slate-50/50">
                      <Move className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <h5 className="text-sm font-bold text-gray-700">
                        Chưa có khối nội dung nào
                      </h5>
                      <p className="text-xs text-gray-400 mt-1">
                        Chọn loại khối bên dưới và nhấn Thêm để bắt đầu thiết
                        kế.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {formSections.map((sec, idx) => {
                        const typeLabel =
                          sectionTypesList.find((t) => t.value === sec.type)
                            ?.label || sec.type;

                        return (
                          <div
                            key={idx}
                            className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden flex flex-col transition hover:border-gray-300"
                          >
                            {/* Block Header */}
                            <div className="bg-slate-50 border-b border-gray-200 px-5 py-3 flex justify-between items-center shrink-0 select-none">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg">
                                  {idx + 1}
                                </span>
                                <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                                  {typeLabel}
                                </span>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveSection(idx, "up")}
                                  className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                                  title="Di chuyển lên"
                                >
                                  <ChevronUp className="h-4.5 w-4.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === formSections.length - 1}
                                  onClick={() => handleMoveSection(idx, "down")}
                                  className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                                  title="Di chuyển xuống"
                                >
                                  <ChevronDown className="h-4.5 w-4.5" />
                                </button>
                                <div className="w-[1px] h-4 bg-gray-300 mx-1" />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSection(idx)}
                                  className="p-1 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition cursor-pointer"
                                  title="Xóa khối"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              </div>
                            </div>

                            {/* Block Content Inputs */}
                            <div className="p-5 space-y-4">
                              {/* 1. HERO BLOCK */}
                              {sec.type === "hero" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Tiêu đề lớn
                                    </label>
                                    <input
                                      type="text"
                                      value={sec.data.title || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "title",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Phụ đề
                                    </label>
                                    <input
                                      type="text"
                                      value={sec.data.subtitle || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "subtitle",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Mô tả ngắn
                                    </label>
                                    <textarea
                                      value={sec.data.description || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "description",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs h-16 resize-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Nhãn nút CTA
                                    </label>
                                    <input
                                      type="text"
                                      value={sec.data.buttonText || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "buttonText",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Đường dẫn CTA
                                    </label>
                                    <input
                                      type="text"
                                      value={sec.data.buttonLink || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "buttonLink",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                    />
                                  </div>
                                  {/* Cover Image Upload */}
                                  <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Ảnh bìa Hero
                                    </label>
                                    <div className="flex items-center gap-3">
                                      <div className="w-16 h-12 border rounded bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                        {sec.data.coverImage ? (
                                          <img
                                            src={sec.data.coverImage}
                                            alt="Hero"
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-[8px] text-gray-400">
                                            Không ảnh
                                          </span>
                                        )}
                                      </div>
                                      <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer">
                                        <Upload className="h-3.5 w-3.5" />
                                        <span>Tải ảnh</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) =>
                                            handleSectionImageUpload(
                                              e,
                                              idx,
                                              "coverImage",
                                            )
                                          }
                                          className="hidden"
                                        />
                                      </label>
                                      <input
                                        type="text"
                                        value={sec.data.coverImage || ""}
                                        onChange={(e) =>
                                          handleUpdateSectionData(
                                            idx,
                                            "coverImage",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Hoặc điền URL ảnh..."
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 2. STORY BLOCK */}
                              {sec.type === "story" && (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Tiêu đề phụ câu chuyện
                                    </label>
                                    <input
                                      type="text"
                                      value={sec.data.heading || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "heading",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1 text-left min-h-[180px]">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Nội dung câu chuyện
                                    </label>
                                    <div className="rounded-lg overflow-hidden border border-gray-200">
                                      <ReactQuill
                                        value={sec.data.content || ""}
                                        onChange={(val) =>
                                          handleUpdateSectionData(
                                            idx,
                                            "content",
                                            val,
                                          )
                                        }
                                        theme="snow"
                                        className="h-32 bg-white"
                                        modules={{
                                          toolbar: [
                                            [
                                              "bold",
                                              "italic",
                                              "underline",
                                              "clean",
                                            ],
                                            [
                                              { list: "ordered" },
                                              { list: "bullet" },
                                            ],
                                            ["link", "image"],
                                          ],
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 3. GALLERY BLOCK */}
                              {sec.type === "gallery" && (
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center select-none">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Danh sách hình ảnh bộ sưu tập
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleAddGalleryImage(idx)}
                                      className="flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Thêm ảnh
                                    </button>
                                  </div>

                                  <div className="space-y-3">
                                    {(sec.data.images || []).map(
                                      (img, imgIdx) => (
                                        <div
                                          key={imgIdx}
                                          className="flex gap-4 items-center bg-slate-50/50 p-3 rounded-xl border border-gray-100 relative"
                                        >
                                          <div className="w-16 h-12 border rounded bg-white flex items-center justify-center overflow-hidden shrink-0">
                                            {img.imageUrl ? (
                                              <img
                                                src={img.imageUrl}
                                                alt="Gallery item"
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <span className="text-[8px] text-gray-400">
                                                Trống
                                              </span>
                                            )}
                                          </div>

                                          <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-[9px] font-bold uppercase tracking-wider rounded-lg cursor-pointer shrink-0">
                                            <Upload className="h-3 w-3" />
                                            <span>Tải</span>
                                            <input
                                              type="file"
                                              accept="image/*"
                                              onChange={(e) =>
                                                handleGalleryImageUpload(
                                                  e,
                                                  idx,
                                                  imgIdx,
                                                )
                                              }
                                              className="hidden"
                                            />
                                          </label>

                                          <div className="flex-1 space-y-1.5">
                                            <input
                                              type="text"
                                              value={img.imageUrl || ""}
                                              onChange={(e) =>
                                                handleUpdateGalleryImageField(
                                                  idx,
                                                  imgIdx,
                                                  "imageUrl",
                                                  e.target.value,
                                                )
                                              }
                                              placeholder="URL ảnh..."
                                              className="w-full px-3 py-1 border border-gray-200 rounded-lg text-[10px]"
                                            />
                                            <input
                                              type="text"
                                              value={img.caption || ""}
                                              onChange={(e) =>
                                                handleUpdateGalleryImageField(
                                                  idx,
                                                  imgIdx,
                                                  "caption",
                                                  e.target.value,
                                                )
                                              }
                                              placeholder="Caption ảnh..."
                                              className="w-full px-3 py-1 border border-gray-200 rounded-lg text-[10px]"
                                            />
                                          </div>

                                          {/* Image order controls */}
                                          <div className="flex flex-col gap-1 select-none">
                                            <button
                                              type="button"
                                              disabled={imgIdx === 0}
                                              onClick={() =>
                                                handleMoveGalleryImage(
                                                  idx,
                                                  imgIdx,
                                                  "up",
                                                )
                                              }
                                              className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 cursor-pointer"
                                            >
                                              <ChevronUp className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              disabled={
                                                imgIdx ===
                                                sec.data.images.length - 1
                                              }
                                              onClick={() =>
                                                handleMoveGalleryImage(
                                                  idx,
                                                  imgIdx,
                                                  "down",
                                                )
                                              }
                                              className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 cursor-pointer"
                                            >
                                              <ChevronDown className="h-3.5 w-3.5" />
                                            </button>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveGalleryImage(
                                                idx,
                                                imgIdx,
                                              )
                                            }
                                            className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition cursor-pointer"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 4. QUOTE BLOCK */}
                              {sec.type === "quote" && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Nội dung quote
                                    </label>
                                    <textarea
                                      value={sec.data.quote || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "quote",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Sự thanh lịch..."
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs h-16 resize-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Tác giả / Thương hiệu
                                    </label>
                                    <input
                                      type="text"
                                      value={sec.data.author || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "author",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Christian Dior"
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* 5. IMAGE + TEXT BLOCK */}
                              {sec.type === "image_text" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Tiêu đề
                                    </label>
                                    <input
                                      type="text"
                                      value={sec.data.title || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "title",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Vị trí ảnh
                                    </label>
                                    <select
                                      value={sec.data.imagePosition || "left"}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "imagePosition",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white"
                                    >
                                      <option value="left">Ảnh bên trái</option>
                                      <option value="right">
                                        Ảnh bên phải
                                      </option>
                                    </select>
                                  </div>
                                  <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Nội dung
                                    </label>
                                    <textarea
                                      value={sec.data.content || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "content",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs h-20 resize-none"
                                    />
                                  </div>
                                  {/* Upload Image */}
                                  <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Ảnh minh họa
                                    </label>
                                    <div className="flex items-center gap-3">
                                      <div className="w-16 h-12 border rounded bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                        {sec.data.image ? (
                                          <img
                                            src={sec.data.image}
                                            alt="Showcase"
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-[8px] text-gray-400">
                                            Không ảnh
                                          </span>
                                        )}
                                      </div>
                                      <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer">
                                        <Upload className="h-3.5 w-3.5" />
                                        <span>Tải ảnh</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) =>
                                            handleSectionImageUpload(
                                              e,
                                              idx,
                                              "image",
                                            )
                                          }
                                          className="hidden"
                                        />
                                      </label>
                                      <input
                                        type="text"
                                        value={sec.data.image || ""}
                                        onChange={(e) =>
                                          handleUpdateSectionData(
                                            idx,
                                            "image",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="URL ảnh..."
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 6. PRODUCTS BLOCK */}
                              {sec.type === "products" && (
                                <div className="space-y-4">
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Tìm và liên kết sản phẩm
                                    </label>
                                    <div className="relative">
                                      <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                        <input
                                          type="text"
                                          value={
                                            activeProductSectionIdx === idx
                                              ? productSearch
                                              : ""
                                          }
                                          onFocus={() =>
                                            setActiveProductSectionIdx(idx)
                                          }
                                          onChange={(e) =>
                                            setProductSearch(e.target.value)
                                          }
                                          placeholder="Nhập tên sản phẩm để tìm kiếm..."
                                          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs"
                                        />
                                        {searchingProducts &&
                                          activeProductSectionIdx === idx && (
                                            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-gray-400" />
                                          )}
                                      </div>

                                      {/* Suggestions Dropdown for specific product spotlights */}
                                      {activeProductSectionIdx === idx &&
                                        productSuggestions.length > 0 && (
                                          <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-lg z-20 divide-y divide-gray-50 overflow-hidden">
                                            {productSuggestions.map((prod) => (
                                              <div
                                                key={prod._id}
                                                onClick={() =>
                                                  handleAddProduct(prod)
                                                }
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer transition select-none"
                                              >
                                                <div className="w-8 h-8 rounded bg-gray-50 overflow-hidden border shrink-0">
                                                  <img
                                                    src={
                                                      prod.displayProduct?.[0]
                                                    }
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                  />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <div className="text-[11px] font-bold text-gray-800 truncate">
                                                    {prod.name}
                                                  </div>
                                                </div>
                                                <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                  Thêm
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                    </div>
                                  </div>

                                  {/* List of currently associated product tags */}
                                  <div className="flex flex-wrap gap-2 pt-2 select-none">
                                    {(sec.data.productIds || []).map(
                                      (prodId) => {
                                        const prodObj = selectedProducts.find(
                                          (p) => p._id === prodId,
                                        );
                                        return (
                                          <div
                                            key={prodId}
                                            className="inline-flex items-center gap-2 px-2.5 py-1 bg-neutral-50 text-[10px] font-bold border border-gray-200 text-gray-700 rounded-lg hover:border-red-200 transition"
                                          >
                                            {prodObj?.displayProduct?.[0] && (
                                              <img
                                                src={prodObj.displayProduct[0]}
                                                alt=""
                                                className="w-4.5 h-4.5 object-cover rounded-sm shrink-0 border"
                                              />
                                            )}
                                            <span>
                                              {prodObj ? prodObj.name : prodId}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRemoveProductFromSection(
                                                  idx,
                                                  prodId,
                                                )
                                              }
                                              className="text-gray-400 hover:text-red-500"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </div>
                                        );
                                      },
                                    )}
                                    {(sec.data.productIds || []).length ===
                                      0 && (
                                      <span className="text-[10px] text-gray-400 italic">
                                        Chưa chọn sản phẩm nào
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 7. BANNER BLOCK */}
                              {sec.type === "banner" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Tiêu đề đè lên banner
                                    </label>
                                    <input
                                      type="text"
                                      value={sec.data.title || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "title",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Phụ đề đè lên banner
                                    </label>
                                    <input
                                      type="text"
                                      value={sec.data.subtitle || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "subtitle",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Nhãn nút CTA
                                    </label>
                                    <input
                                      type="text"
                                      value={sec.data.buttonText || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "buttonText",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Đường dẫn CTA
                                    </label>
                                    <input
                                      type="text"
                                      value={sec.data.buttonLink || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "buttonLink",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                    />
                                  </div>
                                  {/* Upload Image */}
                                  <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Ảnh Banner (rộng toàn màn hình)
                                    </label>
                                    <div className="flex items-center gap-3">
                                      <div className="w-16 h-12 border rounded bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                        {sec.data.image ? (
                                          <img
                                            src={sec.data.image}
                                            alt="Banner"
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-[8px] text-gray-400">
                                            Không ảnh
                                          </span>
                                        )}
                                      </div>
                                      <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer">
                                        <Upload className="h-3.5 w-3.5" />
                                        <span>Tải ảnh</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) =>
                                            handleSectionImageUpload(
                                              e,
                                              idx,
                                              "image",
                                            )
                                          }
                                          className="hidden"
                                        />
                                      </label>
                                      <input
                                        type="text"
                                        value={sec.data.image || ""}
                                        onChange={(e) =>
                                          handleUpdateSectionData(
                                            idx,
                                            "image",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="URL ảnh..."
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 8. CTA BLOCK */}
                              {sec.type === "cta" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Tiêu đề CTA
                                    </label>
                                    <input
                                      type="text"
                                      value={sec.data.title || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "title",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Nội dung / Lời kêu gọi
                                    </label>
                                    <textarea
                                      value={sec.data.description || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "description",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs h-16 resize-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Nhãn nút CTA
                                    </label>
                                    <input
                                      type="text"
                                      value={sec.data.buttonText || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "buttonText",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      Đường dẫn nút CTA
                                    </label>
                                    <input
                                      type="text"
                                      value={sec.data.buttonLink || ""}
                                      onChange={(e) =>
                                        handleUpdateSectionData(
                                          idx,
                                          "buttonLink",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add New Section Controls */}
                  <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 flex flex-wrap gap-4 items-center select-none justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Thêm khối mới:
                      </span>
                      <select
                        value={newSectionType}
                        onChange={(e) => setNewSectionType(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white cursor-pointer"
                      >
                        {sectionTypesList.map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-200 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Thêm khối nội dung</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-200 text-black text-xs font-black uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer hover:scale-102 active:scale-98"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Lưu thay đổi"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageManagement;
