import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  Percent,
  Calendar,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import voucherApi from '../../api/voucher.api';
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

const getStatusBadge = (status) => {
  const map = {
    ACTIVE: { label: 'Hoạt động', variant: 'success' },
    EXPIRED: { label: 'Hết hạn', variant: 'danger' },
    OUT_OF_STOCK: { label: 'Hết lượt', variant: 'warning' },
    DISABLED: { label: 'Tạm dừng', variant: 'neutral' },
  };
  const item = map[status] || { label: status || 'Không rõ', variant: 'neutral' };
  return (
    <AdminBadge variant={item.variant} dot size="sm">
      {item.label}
    </AdminBadge>
  );
};

const CouponManagement = () => {
  useDocumentTitle('Quản lý khuyến mãi — 404Studio Admin');
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter & Pagination states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [discountType, setDiscountType] = useState('');
  const [sortBy] = useState('createdAt');
  const [sortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentVoucherId, setCurrentVoucherId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDiscountType, setFormDiscountType] = useState('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState('');
  const [formMaxDiscountAmount, setFormMaxDiscountAmount] = useState('');
  const [formMinOrderValue, setFormMinOrderValue] = useState('');
  const [formTotalQuantity, setFormTotalQuantity] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formVoucherType, setFormVoucherType] = useState('order');
  const [formApplicableProducts, setFormApplicableProducts] = useState([]);
  const [formApplicableCategories, setFormApplicableCategories] = useState([]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await voucherApi.getAdminVouchers({
        page,
        limit,
        search,
        status,
        discountType,
        sortBy,
        sortOrder,
      });
      if (res.success) {
        setVouchers(res.data || []);
        setPagination(
          res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [page, search, status, discountType, sortBy, sortOrder]);

  const handleOpenAddModal = () => {
    setFormCode('');
    setFormName('');
    setFormDescription('');
    setFormDiscountType('percentage');
    setFormDiscountValue('');
    setFormMaxDiscountAmount('');
    setFormMinOrderValue('');
    setFormTotalQuantity('');
    setFormVoucherType('order');
    setFormApplicableProducts([]);
    setFormApplicableCategories([]);

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    setFormStartDate(today.toISOString().split('T')[0]);
    setFormEndDate(nextWeek.toISOString().split('T')[0]);
    setFormStatus('ACTIVE');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (v) => {
    setCurrentVoucherId(v._id);
    setFormCode(v.code || '');
    setFormName(v.name || '');
    setFormDescription(v.description || '');
    setFormDiscountType(v.discountType || 'percentage');
    setFormDiscountValue(v.discountValue || '');
    setFormMaxDiscountAmount(v.maxDiscountAmount || '');
    setFormMinOrderValue(v.minOrderValue || '');
    setFormTotalQuantity(v.totalQuantity || '');
    setFormVoucherType(v.voucherType || 'order');
    setFormApplicableProducts(v.applicableProducts || []);
    setFormApplicableCategories(v.applicableCategories || []);

    setFormStartDate(new Date(v.startDate).toISOString().split('T')[0]);
    setFormEndDate(new Date(v.endDate).toISOString().split('T')[0]);
    setFormStatus(v.status || 'ACTIVE');
    setIsEditModalOpen(true);
  };

  const validateForm = () => {
    if (!formCode.trim()) {
      toast.error('Mã code voucher không được để trống!');
      return false;
    }
    if (!formName.trim()) {
      toast.error('Tên voucher không được để trống!');
      return false;
    }
    if (!formDiscountValue || Number(formDiscountValue) <= 0) {
      toast.error('Giá trị giảm giá phải lớn hơn 0!');
      return false;
    }
    if (formDiscountType === 'percentage' && Number(formDiscountValue) > 100) {
      toast.error('Phần trăm giảm giá không thể lớn hơn 100%!');
      return false;
    }
    if (!formTotalQuantity || Number(formTotalQuantity) <= 0) {
      toast.error('Tổng số lượng voucher phải lớn hơn 0!');
      return false;
    }
    if (!formStartDate || !formEndDate) {
      toast.error('Vui lòng chọn ngày bắt đầu và kết thúc!');
      return false;
    }
    if (new Date(formEndDate) <= new Date(formStartDate)) {
      toast.error('Ngày kết thúc phải lớn hơn ngày bắt đầu!');
      return false;
    }
    return true;
  };

  const handleAddVoucher = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        description: formDescription.trim(),
        discountType: formDiscountType,
        discountValue: Number(formDiscountValue),
        maxDiscountAmount:
          formDiscountType === 'percentage'
            ? Number(formMaxDiscountAmount) || 0
            : 0,
        minOrderValue: Number(formMinOrderValue) || 0,
        totalQuantity: Number(formTotalQuantity),
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(formEndDate).toISOString(),
        status: formStatus,
        voucherType: formVoucherType,
        applicableProducts: formApplicableProducts,
        applicableCategories: formApplicableCategories,
      };

      const res = await voucherApi.createVoucher(payload);
      if (res.success) {
        toast.success('Thêm voucher mới thành công!');
        setIsAddModalOpen(false);
        fetchVouchers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo voucher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditVoucher = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        endDate: new Date(formEndDate).toISOString(),
        totalQuantity: Number(formTotalQuantity),
        status: formStatus,
        voucherType: formVoucherType,
        applicableProducts: formApplicableProducts,
        applicableCategories: formApplicableCategories,
      };

      const res = await voucherApi.updateVoucher(currentVoucherId, payload);
      if (res.success) {
        toast.success('Cập nhật voucher thành công!');
        setIsEditModalOpen(false);
        fetchVouchers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật voucher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVoucher = async (id, code) => {
    const result = await Swal.fire({
      title: 'Xóa mã giảm giá này?',
      text: `Mã ${code} sẽ bị xóa và người dùng không thể áp dụng được nữa.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        const res = await voucherApi.deleteVoucher(id);
        if (res.success) {
          toast.success(`Đã xóa voucher ${code}!`);
          fetchVouchers();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Lỗi khi xóa voucher');
      }
    }
  };

  const toggleStatus = async (id) => {
    try {
      const res = await voucherApi.toggleVoucherStatus(id);
      if (res.success) {
        toast.success('Đã chuyển đổi trạng thái voucher!');
        fetchVouchers();
      }
    } catch {
      toast.error('Không thể thay đổi trạng thái voucher!');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.info(`Đã sao chép mã: ${code}`);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <AdminPageHeader
        title="Quản lý mã giảm giá"
        description="Thiết lập các chương trình ưu đãi, mã chiết khấu và phiếu giảm giá cho đơn hàng"
        breadcrumbs={[{ label: 'Vouchers' }]}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchVouchers}
              aria-label="Làm mới danh sách"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white font-semibold text-xs px-4 h-10 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo Voucher mới</span>
            </button>
          </div>
        }
      />

      {/* Main Table Card */}
      <AdminCard noPadding>
        {/* Filters Toolbar */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên voucher..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30"
              />
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="EXPIRED">Hết hạn</option>
              <option value="DISABLED">Tạm ngưng</option>
            </select>

            <select
              value={discountType}
              onChange={(e) => {
                setDiscountType(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 cursor-pointer"
            >
              <option value="">Loại giảm giá</option>
              <option value="percentage">Theo phần trăm (%)</option>
              <option value="fixed">Số tiền cố định (VNĐ)</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium shrink-0">
            Tổng cộng: <strong className="text-slate-900 dark:text-white">{pagination.total}</strong> mã
          </span>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : vouchers.length === 0 ? (
          <AdminEmptyState
            icon={Ticket}
            title="Chưa có mã giảm giá nào"
            description={
              search
                ? `Không có mã nào khớp với từ khóa "${search}".`
                : 'Tạo mã voucher đầu tiên để kích cầu mua sắm cho khách hàng.'
            }
            action={
              !search && (
                <button
                  onClick={handleOpenAddModal}
                  className="bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Tạo voucher ngay
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
                    <th className="px-6 py-3.5">Mã Voucher</th>
                    <th className="px-6 py-3.5">Chiết khấu</th>
                    <th className="px-6 py-3.5">Đơn tối thiểu</th>
                    <th className="px-6 py-3.5">Đã dùng / Tổng</th>
                    <th className="px-6 py-3.5">Thời hạn</th>
                    <th className="px-6 py-3.5 text-center">Trạng thái</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {vouchers.map((v) => {
                    const discountDisplay =
                      v.discountType === 'percentage'
                        ? `${v.discountValue}% (tối đa ${v.maxDiscountAmount?.toLocaleString('vi-VN')} đ)`
                        : `${v.discountValue?.toLocaleString('vi-VN')} đ`;

                    const used = v.usedQuantity || 0;
                    const total = v.totalQuantity || 1;
                    const usagePercent = Math.min(
                      100,
                      Math.round((used / total) * 100)
                    );

                    return (
                      <tr
                        key={v._id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        {/* Code */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs bg-[#05251C]/10 text-[#05251C] dark:bg-[#F5DD20]/15 dark:text-[#F5DD20] border border-[#05251C]/20 dark:border-[#F5DD20]/30 px-2 py-0.5 rounded-md">
                              {v.code}
                            </span>
                            <button
                              onClick={() => copyCode(v.code)}
                              aria-label="Sao chép mã"
                              className="text-slate-400 hover:text-slate-700 transition"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold mt-1">
                            {v.name}
                          </div>
                        </td>

                        {/* Discount */}
                        <td className="px-6 py-3.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {discountDisplay}
                          </span>
                        </td>

                        {/* Min Order */}
                        <td className="px-6 py-3.5 font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                          {(v.minOrderValue || 0).toLocaleString('vi-VN')} đ
                        </td>

                        {/* Usage Progress */}
                        <td className="px-6 py-3.5">
                          <div className="text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                            {used} / {total} ({usagePercent}%)
                          </div>
                          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-[#05251C] dark:bg-[#F5DD20] rounded-full"
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </td>

                        {/* Dates */}
                        <td className="px-6 py-3.5 text-slate-500 text-[11px]">
                          <div>Từ: {new Date(v.startDate).toLocaleDateString('vi-VN')}</div>
                          <div>Đến: {new Date(v.endDate).toLocaleDateString('vi-VN')}</div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-3.5 text-center">
                          {getStatusBadge(v.status)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => toggleStatus(v._id)}
                              aria-label="Bật/Tắt trạng thái"
                              className={`flex h-8 w-8 items-center justify-center rounded-lg transition cursor-pointer ${
                                v.status === 'ACTIVE'
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-slate-400 hover:bg-slate-100'
                              }`}
                              title={v.status === 'ACTIVE' ? 'Tạm dừng mã' : 'Kích hoạt mã'}
                            >
                              <Power className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(v)}
                              aria-label={`Chỉnh sửa ${v.code}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Chỉnh sửa voucher"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVoucher(v._id, v.code)}
                              aria-label={`Xóa ${v.code}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                              title="Xóa voucher"
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

            <AdminPagination
              page={page}
              limit={limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </AdminCard>

      {/* Add / Edit Modal */}
      <AdminModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Tạo mã voucher mới' : `Chỉnh sửa voucher [${formCode}]`}
        description="Điền thông số chiết khấu và điều kiện áp dụng phiếu giảm giá"
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="voucher-form"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {submitting ? 'Đang lưu...' : isAddModalOpen ? 'Tạo voucher' : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <form
          id="voucher-form"
          onSubmit={isAddModalOpen ? handleAddVoucher : handleEditVoucher}
          className="space-y-4"
        >
          {/* Section 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mã giảm giá (Code) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEditModalOpen}
                placeholder="VD: SUMMER2026, WELCOME10"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tên chương trình voucher <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Giảm 20% cho đơn hàng đầu tiên"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Section 2: Discount & Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Loại chiết khấu <span className="text-red-500">*</span>
              </label>
              <select
                disabled={isEditModalOpen}
                value={formDiscountType}
                onChange={(e) => setFormDiscountType(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 disabled:opacity-60 cursor-pointer"
              >
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (VNĐ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mức giảm ({formDiscountType === 'percentage' ? '%' : 'VNĐ'}){' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                disabled={isEditModalOpen}
                placeholder={formDiscountType === 'percentage' ? '20' : '50000'}
                value={formDiscountValue}
                onChange={(e) => setFormDiscountValue(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 disabled:opacity-60"
              />
            </div>

            {formDiscountType === 'percentage' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Giảm tối đa (VNĐ)
                </label>
                <input
                  type="number"
                  disabled={isEditModalOpen}
                  placeholder="100000 (0 = không giới hạn)"
                  value={formMaxDiscountAmount}
                  onChange={(e) => setFormMaxDiscountAmount(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 disabled:opacity-60"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Giá trị đơn hàng tối thiểu (VNĐ)
              </label>
              <input
                type="number"
                disabled={isEditModalOpen}
                placeholder="200000"
                value={formMinOrderValue}
                onChange={(e) => setFormMinOrderValue(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tổng số lượng phát hành <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="100"
                value={formTotalQuantity}
                onChange={(e) => setFormTotalQuantity(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ngày bắt đầu có hiệu lực
              </label>
              <input
                type="date"
                required
                disabled={isEditModalOpen}
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ngày hết hạn <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mô tả chi tiết điều kiện áp dụng
            </label>
            <textarea
              rows={3}
              placeholder="VD: Áp dụng cho các sản phẩm thuộc bộ sưu tập Thu Đông..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
            />
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default CouponManagement;
