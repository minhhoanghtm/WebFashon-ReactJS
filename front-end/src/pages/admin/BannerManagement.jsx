import React, { useState } from 'react';
import { useBanners } from '../../hooks/useBanners';
import { uploadImageService } from '../../services/upload.service';
import {
  Image as ImageIcon,
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  Upload,
  Calendar,
  ExternalLink,
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

const positionLabels = {
  home_hero: 'Trang chủ (Hero)',
  home_secondary: 'Trang chủ (Phụ)',
  category_header: 'Đầu trang Danh mục',
  lookbook_header: 'Đầu trang Lookbook',
  footer_banner: 'Banner Chân trang',
};

const BannerManagement = () => {
  useDocumentTitle('Quản lý banner — 404Studio Admin');
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
  const [modalMode, setModalMode] = useState('add');
  const [currentId, setCurrentId] = useState(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formMobileImageUrl, setFormMobileImageUrl] = useState('');
  const [formLinkUrl, setFormLinkUrl] = useState('');
  const [formButtonText, setFormButtonText] = useState('');
  const [formPosition, setFormPosition] = useState('home_hero');
  const [formTargetType, setFormTargetType] = useState('external');
  const [formTargetId, setFormTargetId] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);

  // Upload states
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setModalMode('add');
    setCurrentId(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormImageUrl('');
    setFormMobileImageUrl('');
    setFormLinkUrl('');
    setFormButtonText('');
    setFormPosition('home_hero');
    setFormTargetType('external');
    setFormTargetId('');

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
    setModalMode('edit');
    setCurrentId(banner._id || banner.id);
    setFormTitle(banner.title || '');
    setFormSubtitle(banner.subtitle || '');
    setFormImageUrl(banner.imageUrl || '');
    setFormMobileImageUrl(banner.mobileImageUrl || '');
    setFormLinkUrl(banner.linkUrl || '');
    setFormButtonText(banner.buttonText || '');
    setFormPosition(banner.position || 'home_hero');
    setFormTargetType(banner.targetType || 'external');
    setFormTargetId(banner.targetId || '');

    const formatForInput = (dateVal) => {
      if (!dateVal) return '';
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
    };

    setFormStartDate(formatForInput(banner.startDate));
    setFormEndDate(formatForInput(banner.endDate));
    setFormSortOrder(banner.sortOrder || 0);
    setFormIsActive(Boolean(banner.isActive));
    setIsOpenModal(true);
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (type === 'desktop') {
        setUploadingDesktop(true);
        const url = await uploadImageService(file);
        setFormImageUrl(url);
      } else {
        setUploadingMobile(true);
        const url = await uploadImageService(file);
        setFormMobileImageUrl(url);
      }
      toast.success('Tải ảnh banner thành công!');
    } catch {
      toast.error('Tải ảnh lên thất bại. Vui lòng thử lại!');
    } finally {
      setUploadingDesktop(false);
      setUploadingMobile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      toast.error('Tiêu đề banner là bắt buộc!');
      return;
    }
    if (!formImageUrl.trim()) {
      toast.error('Vui lòng tải lên ảnh Desktop Banner!');
      return;
    }
    if (!formStartDate || !formEndDate) {
      toast.error('Vui lòng chọn thời gian bắt đầu và kết thúc!');
      return;
    }
    if (new Date(formStartDate) >= new Date(formEndDate)) {
      toast.error('Ngày kết thúc phải lớn hơn ngày bắt đầu!');
      return;
    }

    const payload = {
      title: formTitle.trim(),
      subtitle: formSubtitle.trim(),
      imageUrl: formImageUrl,
      mobileImageUrl: formMobileImageUrl,
      linkUrl: formLinkUrl,
      buttonText: formButtonText,
      position: formPosition,
      targetType: formTargetType,
      targetId: formTargetId,
      startDate: new Date(formStartDate).toISOString(),
      endDate: new Date(formEndDate).toISOString(),
      sortOrder: Number(formSortOrder) || 0,
      isActive: formIsActive,
    };

    setSubmitting(true);
    let success = false;
    if (modalMode === 'add') {
      success = await createBanner(payload);
    } else {
      success = await updateBanner(currentId, payload);
    }
    setSubmitting(false);

    if (success) {
      setIsOpenModal(false);
    }
  };

  const handleDelete = async (banner) => {
    const result = await Swal.fire({
      title: 'Xóa banner này?',
      text: `Banner "${banner.title}" sẽ không còn hiển thị trên website.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      await deleteBanner(banner._id || banner.id);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <AdminPageHeader
        title="Quản lý Banner quảng bá"
        description="Quản lý các slide hình ảnh Hero trên trang chủ, banner bộ sưu tập và banner sự kiện"
        breadcrumbs={[{ label: 'Banner' }]}
        actions={
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white font-semibold text-xs px-4 h-10 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Banner mới</span>
          </button>
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
                placeholder="Tìm tiêu đề banner..."
                value={filters.search || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                }
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30"
              />
            </div>

            <select
              value={filters.position || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, position: e.target.value, page: 1 }))
              }
              className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 cursor-pointer"
            >
              <option value="">Tất cả vị trí</option>
              <option value="home_hero">Trang chủ (Hero)</option>
              <option value="home_secondary">Trang chủ (Phụ)</option>
              <option value="category_header">Đầu trang Danh mục</option>
              <option value="footer_banner">Chân trang</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium shrink-0">
            Tổng cộng: <strong className="text-slate-900 dark:text-white">{banners.length}</strong> banner
          </span>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={4} cols={5} />
          </div>
        ) : banners.length === 0 ? (
          <AdminEmptyState
            icon={ImageIcon}
            title="Chưa có banner nào"
            description="Tạo banner quảng cáo đầu tiên để thu hút khách hàng trên trang chủ."
            action={
              <button
                onClick={handleOpenAdd}
                className="bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Tạo banner ngay
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 w-32">Hình ảnh</th>
                    <th className="px-6 py-3.5">Tiêu đề & Nút bấm</th>
                    <th className="px-6 py-3.5">Vị trí hiển thị</th>
                    <th className="px-6 py-3.5 text-center">Thứ tự</th>
                    <th className="px-6 py-3.5 text-center">Trạng thái</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {banners.map((b) => (
                    <tr
                      key={b._id || b.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Image Preview */}
                      <td className="px-6 py-3.5">
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="h-14 w-28 object-cover rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs"
                        />
                      </td>

                      {/* Title */}
                      <td className="px-6 py-3.5 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {b.title}
                        </div>
                        {b.subtitle && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {b.subtitle}
                          </div>
                        )}
                        {b.buttonText && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-[#05251C] dark:text-[#F5DD20] bg-[#05251C]/10 dark:bg-[#F5DD20]/15 px-1.5 py-0.5 rounded">
                            Nút: {b.buttonText}
                          </span>
                        )}
                      </td>

                      {/* Position */}
                      <td className="px-6 py-3.5">
                        <AdminBadge variant="neutral" size="sm">
                          {positionLabels[b.position] || b.position}
                        </AdminBadge>
                      </td>

                      {/* Sort Order */}
                      <td className="px-6 py-3.5 text-center font-bold font-mono">
                        {b.sortOrder || 0}
                      </td>

                      {/* Active Status */}
                      <td className="px-6 py-3.5 text-center">
                        {b.isActive ? (
                          <AdminBadge variant="success" dot size="sm">
                            Đang hiển thị
                          </AdminBadge>
                        ) : (
                          <AdminBadge variant="neutral" dot size="sm">
                            Tạm ẩn
                          </AdminBadge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleBannerStatus(b._id || b.id)}
                            aria-label="Chuyển trạng thái"
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition cursor-pointer ${
                              b.isActive
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                            title={b.isActive ? 'Ẩn banner' : 'Kích hoạt banner'}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(b)}
                            aria-label={`Sửa ${b.title}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Chỉnh sửa banner"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(b)}
                            aria-label={`Xóa ${b.title}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                            title="Xóa banner"
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

            {pagination && pagination.totalPages > 1 && (
              <AdminPagination
                page={pagination.page || 1}
                limit={pagination.limit || 10}
                total={pagination.total || banners.length}
                totalPages={pagination.totalPages || 1}
                onPageChange={(newPage) =>
                  setFilters((prev) => ({ ...prev, page: newPage }))
                }
              />
            )}
          </>
        )}
      </AdminCard>

      {/* Add / Edit Banner Modal */}
      <AdminModal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title={modalMode === 'add' ? 'Thêm Banner mới' : 'Chỉnh sửa Banner'}
        description="Tải lên ảnh kích thước chuẩn cho màn hình máy tính và thiết bị di động"
        size="lg"
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
              form="banner-form"
              disabled={submitting || uploadingDesktop || uploadingMobile}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {submitting
                ? 'Đang lưu...'
                : modalMode === 'add'
                ? 'Tạo Banner'
                : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <form id="banner-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tiêu đề Banner <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Bộ sưu tập mùa hè 2026"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tiêu đề phụ (Subtitle)
              </label>
              <input
                type="text"
                placeholder="VD: Phong cách tối giản sang trọng"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Image Uploaders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Ảnh Desktop (1920x800) <span className="text-red-500">*</span>
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'desktop')}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white cursor-pointer"
              />
              {uploadingDesktop && (
                <p className="text-[11px] text-amber-600">Đang tải ảnh lên...</p>
              )}
              {formImageUrl && (
                <img
                  src={formImageUrl}
                  alt="Desktop preview"
                  className="h-20 w-full object-cover rounded-lg border border-slate-200"
                />
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Ảnh Mobile (750x1000)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'mobile')}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white cursor-pointer"
              />
              {uploadingMobile && (
                <p className="text-[11px] text-amber-600">Đang tải ảnh lên...</p>
              )}
              {formMobileImageUrl && (
                <img
                  src={formMobileImageUrl}
                  alt="Mobile preview"
                  className="h-20 w-16 object-cover rounded-lg border border-slate-200"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Vị trí hiển thị <span className="text-red-500">*</span>
              </label>
              <select
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                <option value="home_hero">Trang chủ (Hero Slider)</option>
                <option value="home_secondary">Trang chủ (Khối phụ)</option>
                <option value="category_header">Đầu trang Danh mục</option>
                <option value="footer_banner">Chân trang</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Thứ tự sắp xếp (Sort Order)
              </label>
              <input
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Chữ trên nút (CTA Text)
              </label>
              <input
                type="text"
                placeholder="VD: Khám phá ngay"
                value={formButtonText}
                onChange={(e) => setFormButtonText(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Đường dẫn liên kết (Link URL)
              </label>
              <input
                type="text"
                placeholder="/products?collection=summer"
                value={formLinkUrl}
                onChange={(e) => setFormLinkUrl(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default BannerManagement;
