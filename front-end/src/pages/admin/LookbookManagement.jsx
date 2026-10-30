import React, { useState, useEffect } from 'react';
import {
  adminGetPagesService,
  adminGetPageDetailService,
  adminCreatePageService,
  adminUpdatePageService,
  adminDeletePageService,
  adminToggleFeaturePageService,
} from '../../services/page.service';
import { SectionBuilder } from '../../components/admin/SectionBuilder';
import { uploadImageService } from '../../services/upload.service';
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Layers,
  Info,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  AdminPageHeader,
  AdminCard,
  AdminBadge,
  AdminModal,
  AdminPagination,
  AdminEmptyState,
  TableSkeleton,
} from '@/components/admin/ui';

const defaultLookbookCover =
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600';

const getLookbookStatusBadge = (status) => {
  const map = {
    published: { label: 'Đã xuất bản', variant: 'success' },
    draft: { label: 'Bản nháp', variant: 'neutral' },
    archived: { label: 'Lưu trữ', variant: 'warning' },
  };
  const item = map[status] || { label: status || 'Không rõ', variant: 'neutral' };
  return (
    <AdminBadge variant={item.variant} dot size="sm">
      {item.label}
    </AdminBadge>
  );
};

const LookbookManagement = () => {
  useDocumentTitle('Quản lý Lookbook — 404Studio Admin');
  const [lookbooks, setLookbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Modal State
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentId, setCurrentId] = useState(null);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'sections'

  // Form Fields State
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formStatus, setFormStatus] = useState('draft');
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDescription, setFormSeoDescription] = useState('');
  const [formSeoKeywords, setFormSeoKeywords] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formPublishedAt, setFormPublishedAt] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Relational Blocks state
  const [formSections, setFormSections] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch list of lookbooks
  const fetchLookbooks = async () => {
    try {
      setLoading(true);
      const res = await adminGetPagesService({
        ...filters,
        type: 'lookbook',
      });
      setLookbooks(res.pages || []);
      setPagination({
        page: res.page || 1,
        limit: res.limit || 10,
        totalItems: res.total || 0,
        totalPages: res.totalPages || 1,
      });
    } catch {
      toast.error('Không thể tải danh sách bộ sưu tập!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookbooks();
  }, [filters.page, filters.status]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLookbooks();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [filters.search]);

  useEffect(() => {
    if (modalMode === 'add' && formTitle) {
      const slug = formTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormSlug(slug);
    }
  }, [formTitle, modalMode]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setCurrentId(null);
    setFormTitle('');
    setFormSlug('');
    setFormExcerpt('');
    setFormStatus('draft');
    setFormSeoTitle('');
    setFormSeoDescription('');
    setFormSeoKeywords('');
    setFormDisplayOrder(0);
    setFormPublishedAt('');
    setFormThumbnailUrl('');
    setSelectedProducts([]);
    setFormSections([]);
    setActiveTab('basic');
    setIsOpenModal(true);
  };

  const handleOpenEdit = async (lookbookObj) => {
    try {
      setModalMode('edit');
      setCurrentId(lookbookObj._id);
      const res = await adminGetPageDetailService(lookbookObj._id);
      const page = res.page;
      const sections = res.sections || [];

      setFormTitle(page.title || '');
      setFormSlug(page.slug || '');
      setFormExcerpt(page.excerpt || '');
      setFormStatus(page.status || 'draft');
      setFormSeoTitle(page.seoTitle || '');
      setFormSeoDescription(page.seoDescription || '');
      setFormSeoKeywords(page.seoKeywords || '');
      setFormDisplayOrder(page.displayOrder || 0);
      setFormThumbnailUrl(page.thumbnailUrl || page.bannerUrl || '');

      if (page.publishedAt) {
        setFormPublishedAt(new Date(page.publishedAt).toISOString().slice(0, 16));
      } else {
        setFormPublishedAt('');
      }

      const productsMap = {};
      sections.forEach((sec) => {
        if (sec.type === 'products' && sec.data?.products) {
          sec.data.products.forEach((p) => {
            productsMap[p._id] = p;
          });
        }
      });
      setSelectedProducts(Object.values(productsMap));
      setFormSections(sections);
      setActiveTab('basic');
      setIsOpenModal(true);
    } catch {
      toast.error('Không thể tải chi tiết bộ sưu tập!');
    }
  };

  const handleDelete = async (id, title) => {
    const result = await Swal.fire({
      title: 'Xóa Lookbook?',
      text: `Xóa bộ sưu tập "${title}". Thao tác này không thể hoàn tác.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        await adminDeletePageService(id);
        toast.success(`Đã xóa bộ sưu tập "${title}"!`);
        fetchLookbooks();
      } catch {
        toast.error('Không thể xóa bộ sưu tập!');
      }
    }
  };

  const handleToggleFeature = async (id) => {
    try {
      await adminToggleFeaturePageService(id);
      toast.success('Đã cập nhật trạng thái nổi bật!');
      fetchLookbooks();
    } catch {
      toast.error('Không thể cập nhật trạng thái nổi bật!');
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingThumbnail(true);
      const url = await uploadImageService(file);
      setFormThumbnailUrl(url);
      toast.success('Tải ảnh đại diện thành công!');
    } catch {
      toast.error('Tải ảnh thất bại. Vui lòng thử lại!');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      toast.error('Tiêu đề Lookbook không được để trống!');
      return;
    }
    if (!formSlug.trim()) {
      toast.error('Đường dẫn Slug không được để trống!');
      return;
    }

    const payload = {
      type: 'lookbook',
      title: formTitle.trim(),
      slug: formSlug.trim(),
      excerpt: formExcerpt.trim(),
      status: formStatus,
      thumbnailUrl: formThumbnailUrl,
      bannerUrl: formThumbnailUrl,
      seoTitle: formSeoTitle,
      seoDescription: formSeoDescription,
      seoKeywords: formSeoKeywords,
      displayOrder: Number(formDisplayOrder) || 0,
      publishedAt: formPublishedAt ? new Date(formPublishedAt).toISOString() : null,
      sections: formSections,
    };

    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        await adminCreatePageService(payload);
        toast.success('Tạo bộ sưu tập Lookbook thành công!');
      } else {
        await adminUpdatePageService(currentId, payload);
        toast.success('Cập nhật Lookbook thành công!');
      }
      setIsOpenModal(false);
      fetchLookbooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu Lookbook');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <AdminPageHeader
        title="Quản lý Lookbook thời trang"
        description="Biên soạn các bộ sưu tập thời trang định kỳ với các khối hình ảnh nghệ thuật và sản phẩm phối đồ"
        breadcrumbs={[{ label: 'Lookbook' }]}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchLookbooks}
              aria-label="Làm mới danh sách"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white font-semibold text-xs px-4 h-10 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Lookbook mới</span>
            </button>
          </div>
        }
      />

      {/* Main Table Card */}
      <AdminCard noPadding>
        {/* Filters Bar */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tiêu đề lookbook..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                }
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
              }
              className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium shrink-0">
            Tổng cộng: <strong className="text-slate-900 dark:text-white">{pagination.totalItems}</strong> bộ sưu tập
          </span>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={4} cols={5} />
          </div>
        ) : lookbooks.length === 0 ? (
          <AdminEmptyState
            icon={BookOpen}
            title="Chưa có Lookbook nào"
            description={
              filters.search
                ? `Không có bộ sưu tập nào khớp với từ khóa "${filters.search}".`
                : 'Tạo bộ sưu tập Lookbook đầu tiên để giới thiệu các phong cách thời trang của 404Studio.'
            }
            action={
              !filters.search && (
                <button
                  onClick={handleOpenAdd}
                  className="bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Tạo Lookbook ngay
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 w-24">Bìa</th>
                    <th className="px-6 py-3.5">Bộ sưu tập</th>
                    <th className="px-6 py-3.5 text-center">Nổi bật</th>
                    <th className="px-6 py-3.5 text-center">Trạng thái</th>
                    <th className="px-6 py-3.5">Ngày phát hành</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {lookbooks.map((lb) => (
                    <tr
                      key={lb._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Cover Thumbnail */}
                      <td className="px-6 py-3.5">
                        <img
                          src={lb.thumbnailUrl || lb.bannerUrl || defaultLookbookCover}
                          alt={lb.title}
                          className="h-14 w-20 object-cover rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs"
                        />
                      </td>

                      {/* Title & Slug */}
                      <td className="px-6 py-3.5 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {lb.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                          /lookbooks/{lb.slug}
                        </div>
                      </td>

                      {/* Featured Toggle */}
                      <td className="px-6 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleFeature(lb._id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                            lb.isFeatured
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                          title="Bật/Tắt hiển thị nổi bật"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>{lb.isFeatured ? 'Nổi bật' : 'Thường'}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5 text-center">
                        {getLookbookStatusBadge(lb.status)}
                      </td>

                      {/* Published date */}
                      <td className="px-6 py-3.5 text-slate-500">
                        {lb.publishedAt
                          ? new Date(lb.publishedAt).toLocaleDateString('vi-VN')
                          : 'Chưa đặt'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/lookbooks/${lb.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition"
                            title="Xem trang công khai"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleOpenEdit(lb)}
                            aria-label={`Sửa ${lb.title}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Chỉnh sửa Lookbook"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lb._id, lb.title)}
                            aria-label={`Xóa ${lb.title}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                            title="Xóa Lookbook"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminPagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.totalItems}
              totalPages={pagination.totalPages}
              onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
            />
          </>
        )}
      </AdminCard>

      {/* Add / Edit Modal */}
      <AdminModal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title={modalMode === 'add' ? 'Tạo Lookbook mới' : `Chỉnh sửa: ${formTitle}`}
        description="Thiết lập nội dung trang bộ sưu tập và các khối hình ảnh nghệ thuật"
        size="3xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsOpenModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="lookbook-form"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {submitting ? 'Đang lưu...' : 'Lưu bộ sưu tập'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'basic'
                  ? 'bg-[#05251C]/10 text-[#05251C] dark:bg-[#F5DD20]/15 dark:text-[#F5DD20]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Info className="h-3.5 w-3.5" />
              <span>1. Thông tin chung & Bìa</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sections')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'sections'
                  ? 'bg-[#05251C]/10 text-[#05251C] dark:bg-[#F5DD20]/15 dark:text-[#F5DD20]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>2. Khối nội dung nghệ thuật ({formSections.length})</span>
            </button>
          </div>

          <form id="lookbook-form" onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'basic' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tiêu đề bộ sưu tập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Summer Atelier 2026 — Light and Shade"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Đường dẫn URL (Slug) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Trạng thái xuất bản
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="draft">Bản nháp</option>
                      <option value="published">Đã xuất bản</option>
                      <option value="archived">Lưu trữ</option>
                    </select>
                  </div>
                </div>

                {/* Cover image uploader */}
                <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Ảnh bìa Lookbook (Thumbnail / Banner)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white cursor-pointer"
                  />
                  {uploadingThumbnail && (
                    <p className="text-[11px] text-amber-600">Đang tải ảnh lên...</p>
                  )}
                  {formThumbnailUrl && (
                    <img
                      src={formThumbnailUrl}
                      alt="Thumbnail preview"
                      className="h-28 w-44 object-cover rounded-xl border border-slate-200 shadow-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mô tả ngắn (Excerpt)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tóm tắt ngắn gọn chủ đề và cảm hứng của bộ sưu tập..."
                    value={formExcerpt}
                    onChange={(e) => setFormExcerpt(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            ) : (
              <div>
                <SectionBuilder
                  sections={formSections}
                  setSections={setFormSections}
                  selectedProducts={selectedProducts}
                  setSelectedProducts={setSelectedProducts}
                />
              </div>
            )}
          </form>
        </div>
      </AdminModal>
    </div>
  );
};

export default LookbookManagement;
