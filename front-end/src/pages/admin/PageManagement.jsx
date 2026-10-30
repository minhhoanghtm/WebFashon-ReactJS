import React, { useState, useEffect } from 'react';
import {
  adminGetPagesService,
  adminGetPageByIdService,
  adminCreatePageService,
  adminUpdatePageService,
  adminDeletePageService,
} from '../../services/page.service';
import { SectionBuilder } from '../../components/admin/SectionBuilder';
import {
  FileText,
  Search,
  Plus,
  Edit2,
  Trash2,
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

const typeToPageDetails = {
  about: { title: 'Giới thiệu (About Us)', slug: 'about' },
  policy: { title: 'Chính sách (Policy)', slug: 'policy' },
  faq: { title: 'Hỏi đáp (FAQ)', slug: 'faq' },
  guide: { title: 'Hướng dẫn mua hàng', slug: 'guide' },
  landing: { title: 'Trang Landing', slug: 'landing' },
  blog: { title: 'Blog / Tin tức', slug: 'blog' },
};

const getPageStatusBadge = (status) => {
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

const PageManagement = () => {
  useDocumentTitle('Quản lý trang CMS — 404Studio Admin');
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    type: '',
    status: '',
    excludeType: 'lookbook',
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
  const [formType, setFormType] = useState('about');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formStatus, setFormStatus] = useState('draft');
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDescription, setFormSeoDescription] = useState('');
  const [formSeoKeywords, setFormSeoKeywords] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formPublishedAt, setFormPublishedAt] = useState('');
  const [formSections, setFormSections] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

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
    } catch {
      toast.error('Không thể tải danh sách các trang nội dung!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [filters.page, filters.type, filters.status]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPages();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [filters.search]);

  useEffect(() => {
    if (modalMode === 'add' && typeToPageDetails[formType]) {
      setFormTitle(typeToPageDetails[formType].title);
      setFormSlug(typeToPageDetails[formType].slug);
    }
  }, [formType, modalMode]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setCurrentId(null);
    setFormType('about');
    setFormTitle(typeToPageDetails.about.title);
    setFormSlug(typeToPageDetails.about.slug);
    setFormExcerpt('');
    setFormStatus('draft');
    setFormSeoTitle('');
    setFormSeoDescription('');
    setFormSeoKeywords('');
    setFormDisplayOrder(0);
    setFormPublishedAt('');
    setFormSections([]);
    setSelectedProducts([]);
    setActiveTab('basic');
    setIsOpenModal(true);
  };

  const handleOpenEdit = async (pageObj) => {
    try {
      setModalMode('edit');
      setCurrentId(pageObj._id);
      const page = await adminGetPageByIdService(pageObj._id);

      setFormTitle(page.title || '');
      setFormSlug(page.slug || '');
      setFormType(page.type || 'about');
      setFormExcerpt(page.excerpt || '');
      setFormStatus(page.status || 'draft');
      setFormSeoTitle(page.seoTitle || '');
      setFormSeoDescription(page.seoDescription || '');
      setFormSeoKeywords(page.seoKeywords || '');
      setFormDisplayOrder(page.displayOrder || 0);

      if (page.publishedAt) {
        setFormPublishedAt(new Date(page.publishedAt).toISOString().slice(0, 16));
      } else {
        setFormPublishedAt('');
      }

      setFormSections(page.sections || []);
      setActiveTab('basic');
      setIsOpenModal(true);
    } catch {
      toast.error('Không thể tải chi tiết trang!');
    }
  };

  const handleDelete = async (id, title) => {
    const result = await Swal.fire({
      title: 'Xóa trang này?',
      text: `Trang "${title}" sẽ bị xóa khỏi hệ thống.`,
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
        toast.success(`Đã xóa trang "${title}"!`);
        fetchPages();
      } catch {
        toast.error('Không thể xóa trang!');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      toast.error('Tiêu đề trang không được để trống!');
      return;
    }
    if (!formSlug.trim()) {
      toast.error('Đường dẫn Slug không được để trống!');
      return;
    }

    const payload = {
      type: formType,
      title: formTitle.trim(),
      slug: formSlug.trim(),
      excerpt: formExcerpt.trim(),
      status: formStatus,
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
        toast.success('Tạo trang CMS thành công!');
      } else {
        await adminUpdatePageService(currentId, payload);
        toast.success('Cập nhật trang thành công!');
      }
      setIsOpenModal(false);
      fetchPages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu trang');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <AdminPageHeader
        title="Quản lý trang nội dung CMS"
        description="Quản lý nội dung các trang thông tin thương hiệu, chính sách đổi trả, hướng dẫn và bài viết blog"
        breadcrumbs={[{ label: 'Trang CMS' }]}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchPages}
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
              <span>Thêm trang mới</span>
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
                placeholder="Tìm tiêu đề trang..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                }
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30"
              />
            </div>

            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, type: e.target.value, page: 1 }))
              }
              className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 cursor-pointer"
            >
              <option value="">Tất cả loại trang</option>
              <option value="about">Giới thiệu (About)</option>
              <option value="policy">Chính sách (Policy)</option>
              <option value="faq">Hỏi đáp (FAQ)</option>
              <option value="guide">Hướng dẫn mua hàng</option>
              <option value="landing">Trang Landing</option>
              <option value="blog">Tin tức / Blog</option>
            </select>

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
            Tổng cộng: <strong className="text-slate-900 dark:text-white">{pagination.totalItems}</strong> trang
          </span>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={4} cols={5} />
          </div>
        ) : pages.length === 0 ? (
          <AdminEmptyState
            icon={FileText}
            title="Chưa có trang CMS nào"
            description={
              filters.search
                ? `Không có trang nào khớp với từ khóa "${filters.search}".`
                : 'Bắt đầu tạo các trang giới thiệu thương hiệu và chính sách dịch vụ.'
            }
            action={
              !filters.search && (
                <button
                  onClick={handleOpenAdd}
                  className="bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Tạo trang ngay
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
                    <th className="px-6 py-3.5">Tiêu đề trang</th>
                    <th className="px-6 py-3.5">Đường dẫn (Slug)</th>
                    <th className="px-6 py-3.5">Loại trang</th>
                    <th className="px-6 py-3.5 text-center">Trạng thái</th>
                    <th className="px-6 py-3.5">Ngày phát hành</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {pages.map((p) => (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Title */}
                      <td className="px-6 py-3.5 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {p.title}
                        </div>
                        {p.excerpt && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {p.excerpt}
                          </div>
                        )}
                      </td>

                      {/* Slug */}
                      <td className="px-6 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                        /{p.slug}
                      </td>

                      {/* Type */}
                      <td className="px-6 py-3.5">
                        <AdminBadge variant="neutral" size="sm">
                          {typeToPageDetails[p.type]?.title || p.type}
                        </AdminBadge>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5 text-center">
                        {getPageStatusBadge(p.status)}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-3.5 text-slate-400">
                        {p.publishedAt
                          ? new Date(p.publishedAt).toLocaleDateString('vi-VN')
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition"
                            title="Xem trang công khai"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            aria-label={`Sửa ${p.title}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Chỉnh sửa nội dung"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id, p.title)}
                            aria-label={`Xóa ${p.title}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                            title="Xóa trang"
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
              onPageChange={(newPage) =>
                setFilters((prev) => ({ ...prev, page: newPage }))
              }
            />
          </>
        )}
      </AdminCard>

      {/* Add / Edit CMS Page Modal */}
      <AdminModal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title={modalMode === 'add' ? 'Thêm trang CMS mới' : `Chỉnh sửa: ${formTitle}`}
        description="Cấu hình nội dung, bố cục các khối biên tập và siêu dữ liệu SEO"
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
              form="page-form"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {submitting ? 'Đang lưu...' : 'Lưu trang CMS'}
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
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${activeTab === 'basic'
                ? 'bg-[#05251C]/10 text-[#05251C] dark:bg-[#F5DD20]/15 dark:text-[#F5DD20]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <Info className="h-3.5 w-3.5" />
              <span>1. Thông tin chung & SEO</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sections')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${activeTab === 'sections'
                ? 'bg-[#05251C]/10 text-[#05251C] dark:bg-[#F5DD20]/15 dark:text-[#F5DD20]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>2. Khối nội dung ({formSections.length})</span>
            </button>
          </div>

          <form id="page-form" onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'basic' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Loại trang <span className="text-red-500">*</span>
                    </label>
                    <select
                      disabled={modalMode === 'edit'}
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 disabled:opacity-60 cursor-pointer"
                    >
                      <option value="about">Giới thiệu (About Us)</option>
                      <option value="policy">Chính sách (Policy)</option>
                      <option value="faq">Hỏi đáp (FAQ)</option>
                      <option value="guide">Hướng dẫn mua hàng</option>
                      <option value="landing">Trang Landing</option>
                      <option value="blog">Tin tức / Blog</option>
                    </select>
                  </div>

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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tiêu đề trang <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mô tả ngắn trang (Excerpt)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tóm tắt ngắn gọn nội dung trang..."
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

export default PageManagement;
