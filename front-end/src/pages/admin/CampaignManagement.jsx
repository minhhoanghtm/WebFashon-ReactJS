import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Layers,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  X,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import campaignApi from '@/api/campaignApi';
import { getAllProductService } from '@/services/product.service';
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

const getCampaignStatusBadge = (status) => {
  const map = {
    active: { label: 'Đang diễn ra', variant: 'success' },
    draft: { label: 'Bản nháp', variant: 'neutral' },
    upcoming: { label: 'Sắp diễn ra', variant: 'info' },
    expired: { label: 'Đã kết thúc', variant: 'danger' },
    paused: { label: 'Tạm dừng', variant: 'warning' },
  };
  const item = map[status] || { label: status || 'Không rõ', variant: 'neutral' };
  return (
    <AdminBadge variant={item.variant} dot size="sm">
      {item.label}
    </AdminBadge>
  );
};

const CampaignManagement = () => {
  useDocumentTitle('Chiến dịch Sale — 404Studio Admin');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Master lists
  const [allProducts, setAllProducts] = useState([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentCampaignId, setCurrentCampaignId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formType, setFormType] = useState('flash_sale');
  const [formStatus, setFormStatus] = useState('draft');
  const [formStartAt, setFormStartAt] = useState('');
  const [formEndAt, setFormEndAt] = useState('');
  const [formPriority, setFormPriority] = useState(0);

  // Seasonal rule form
  const [formScope, setFormScope] = useState('all');
  const [formCategoryIds, setFormCategoryIds] = useState([]);
  const [formDiscountType, setFormDiscountType] = useState('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState(10);
  const [formMaxDiscount, setFormMaxDiscount] = useState('');

  // Product addition in detail modal
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSalePrice, setProductSalePrice] = useState('');
  const [productQuota, setProductQuota] = useState(50);
  const [productPerUserLimit, setProductPerUserLimit] = useState('');

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const prods = await getAllProductService();
        setAllProducts(prods || []);
      } catch (err) {
        console.warn('Lỗi tải master products:', err);
      }
    };
    loadMasterData();
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await campaignApi.getAdminCampaigns({
        page,
        limit,
        search,
        status,
        type,
      });
      if (res.data?.success && res.data?.data) {
        setCampaigns(res.data.data.campaigns || []);
        setPagination(
          res.data.data.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1,
          }
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi tải danh sách chiến dịch');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, type]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const resetForm = () => {
    setFormName('');
    setFormSlug('');
    setFormType('flash_sale');
    setFormStatus('draft');
    setFormStartAt('');
    setFormEndAt('');
    setFormPriority(0);
    setFormScope('all');
    setFormCategoryIds([]);
    setFormDiscountType('percentage');
    setFormDiscountValue(10);
    setFormMaxDiscount('');
  };

  const handleSlugAuto = (nameVal) => {
    const slug = nameVal
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/^-+/g, '')
      .replace(/-+$/g, '');
    setFormSlug(slug);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (camp) => {
    setCurrentCampaignId(camp._id);
    setFormName(camp.name || '');
    setFormSlug(camp.slug || '');
    setFormType(camp.type || 'flash_sale');
    setFormStatus(camp.status || 'draft');
    setFormStartAt(
      camp.startAt ? new Date(camp.startAt).toISOString().slice(0, 16) : ''
    );
    setFormEndAt(
      camp.endAt ? new Date(camp.endAt).toISOString().slice(0, 16) : ''
    );
    setFormPriority(camp.priority || 0);

    if (camp.discountRule) {
      setFormScope(camp.discountRule.scope || 'all');
      setFormCategoryIds(camp.discountRule.categoryIds || []);
      setFormDiscountType(camp.discountRule.discountType || 'percentage');
      setFormDiscountValue(camp.discountRule.discountValue || 10);
      setFormMaxDiscount(camp.discountRule.maxDiscountAmount || '');
    }
    setIsEditModalOpen(true);
  };

  const handleSaveCampaign = async (e, isEdit = false) => {
    e.preventDefault();
    if (!formName || !formSlug || !formStartAt || !formEndAt) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    if (new Date(formEndAt) <= new Date(formStartAt)) {
      toast.error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu!');
      return;
    }

    const payload = {
      name: formName.trim(),
      slug: formSlug.trim(),
      type: formType,
      status: formStatus,
      startAt: new Date(formStartAt).toISOString(),
      endAt: new Date(formEndAt).toISOString(),
      priority: Number(formPriority) || 0,
    };

    if (formType === 'seasonal') {
      payload.discountRule = {
        scope: formScope,
        categoryIds: formScope === 'categories' ? formCategoryIds : [],
        discountType: formDiscountType,
        discountValue: Number(formDiscountValue) || 0,
        maxDiscountAmount: formMaxDiscount ? Number(formMaxDiscount) : null,
      };
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await campaignApi.updateCampaign(currentCampaignId, payload);
        toast.success('Cập nhật chiến dịch thành công!');
        setIsEditModalOpen(false);
      } else {
        await campaignApi.createCampaign(payload);
        toast.success('Tạo chiến dịch mới thành công!');
        setIsAddModalOpen(false);
      }
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu chiến dịch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (camp) => {
    const result = await Swal.fire({
      title: 'Xóa chiến dịch này?',
      text: `Xóa chiến dịch "${camp.name}". Các dữ liệu liên quan sẽ được lưu trữ an toàn.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        await campaignApi.deleteCampaign(camp._id);
        toast.success('Đã xóa chiến dịch thành công!');
        fetchCampaigns();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Lỗi khi xóa chiến dịch');
      }
    }
  };

  const openDetail = async (campId) => {
    setCurrentCampaignId(campId);
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await campaignApi.getCampaignDetail(campId);
      if (res.data?.success) {
        setDetailData(res.data.data);
      }
    } catch {
      toast.error('Không thể tải chi tiết chiến dịch');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddProductToCampaign = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !productSalePrice || !productQuota) {
      toast.error('Vui lòng chọn sản phẩm, nhập giá sale và số lượng bán!');
      return;
    }

    try {
      await campaignApi.addProductToCampaign(currentCampaignId, {
        productId: selectedProductId,
        salePrice: Number(productSalePrice),
        quota: Number(productQuota),
        perUserLimit: productPerUserLimit ? Number(productPerUserLimit) : null,
      });
      toast.success('Đã gắn sản phẩm vào Flash Sale!');
      openDetail(currentCampaignId);
      setSelectedProductId('');
      setProductSalePrice('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gắn sản phẩm');
    }
  };

  const handleRemoveProductFromCampaign = async (prodId) => {
    try {
      await campaignApi.removeProductFromCampaign(currentCampaignId, prodId);
      toast.success('Đã gỡ sản phẩm khỏi chiến dịch!');
      openDetail(currentCampaignId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi gỡ sản phẩm');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <AdminPageHeader
        title="Chiến dịch Sale & Giảm giá"
        description="Quản trị các đợt Flash Sale giới hạn thời gian và giảm giá mùa vụ toàn bộ danh mục"
        breadcrumbs={[{ label: 'Chiến dịch' }]}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchCampaigns}
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
              <span>Tạo chiến dịch mới</span>
            </button>
          </div>
        }
      />

      {/* Main Table Card */}
      <AdminCard noPadding>
        {/* Toolbar */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên chiến dịch..."
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
              <option value="active">Đang diễn ra</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="draft">Bản nháp</option>
              <option value="expired">Đã kết thúc</option>
            </select>

            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 cursor-pointer"
            >
              <option value="">Loại chiến dịch</option>
              <option value="flash_sale">Flash Sale</option>
              <option value="seasonal">Theo mùa (Seasonal)</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium shrink-0">
            Tổng cộng: <strong className="text-slate-900 dark:text-white">{pagination.total || campaigns.length}</strong> chiến dịch
          </span>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : campaigns.length === 0 ? (
          <AdminEmptyState
            icon={Zap}
            title="Chưa có chiến dịch nào"
            description={
              search
                ? `Không có kết quả nào trùng với từ khóa "${search}".`
                : 'Tạo đợt Flash Sale hoặc Giảm giá mùa vụ đầu tiên cho cửa hàng.'
            }
            action={
              !search && (
                <button
                  onClick={handleOpenAdd}
                  className="bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Tạo chiến dịch ngay
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
                    <th className="px-6 py-3.5">Tên chiến dịch</th>
                    <th className="px-6 py-3.5">Phân loại</th>
                    <th className="px-6 py-3.5">Thời gian áp dụng</th>
                    <th className="px-6 py-3.5 text-center">Trạng thái</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {campaigns.map((camp) => (
                    <tr
                      key={camp._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Name & Slug */}
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {camp.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          slug: {camp.slug}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-3.5">
                        {camp.type === 'flash_sale' ? (
                          <AdminBadge variant="primary" dot size="sm">
                            Flash Sale
                          </AdminBadge>
                        ) : (
                          <AdminBadge variant="info" dot size="sm">
                            Theo mùa
                          </AdminBadge>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="px-6 py-3.5 text-slate-500 text-[11px]">
                        <div>Từ: {new Date(camp.startAt).toLocaleString('vi-VN')}</div>
                        <div>Đến: {new Date(camp.endAt).toLocaleString('vi-VN')}</div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5 text-center">
                        {getCampaignStatusBadge(camp.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDetail(camp._id)}
                            aria-label={`Xem chi tiết ${camp.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Xem sản phẩm trong chiến dịch"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(camp)}
                            aria-label={`Sửa ${camp.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Chỉnh sửa chiến dịch"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(camp)}
                            aria-label={`Xóa ${camp.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                            title="Xóa chiến dịch"
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
              page={page}
              limit={limit}
              total={pagination.total || campaigns.length}
              totalPages={pagination.totalPages || 1}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </AdminCard>

      {/* Add / Edit Campaign Modal */}
      <AdminModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Tạo chiến dịch Sale mới' : `Chỉnh sửa chiến dịch: ${formName}`}
        description="Cấu hình khung thời gian, điều kiện giảm giá và quy mô chiến dịch"
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
              form="campaign-form"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {submitting ? 'Đang lưu...' : isAddModalOpen ? 'Tạo chiến dịch' : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <form
          id="campaign-form"
          onSubmit={(e) => handleSaveCampaign(e, isEditModalOpen)}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên chiến dịch <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Flash Sale Giữa Tháng 11"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                if (isAddModalOpen) handleSlugAuto(e.target.value);
              }}
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
                Loại chiến dịch <span className="text-red-500">*</span>
              </label>
              <select
                disabled={isEditModalOpen}
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 disabled:opacity-60 cursor-pointer"
              >
                <option value="flash_sale">Flash Sale (Sản phẩm chọn lọc & giá sâu)</option>
                <option value="seasonal">Giảm giá mùa vụ (Áp dụng theo danh mục)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Thời gian bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formStartAt}
                onChange={(e) => setFormStartAt(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Thời gian kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formEndAt}
                onChange={(e) => setFormEndAt(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Trạng thái
            </label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="draft">Bản nháp (draft)</option>
              <option value="active">Kích hoạt ngay (active)</option>
              <option value="paused">Tạm dừng (paused)</option>
            </select>
          </div>
        </form>
      </AdminModal>

      {/* Campaign Detail / Products Assignment Modal */}
      {isDetailModalOpen && (
        <AdminModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Sản phẩm trong chiến dịch: ${detailData?.name || 'Chi tiết'}`}
          description="Quản lý danh sách sản phẩm tham gia và quota giá bán đặc biệt"
          size="2xl"
          footer={
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] rounded-xl transition cursor-pointer"
            >
              Hoàn tất
            </button>
          }
        >
          {detailLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Đang tải danh sách sản phẩm tham gia...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Form Add Product */}
              <form
                onSubmit={handleAddProductToCampaign}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Gắn thêm sản phẩm vào chiến dịch
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                    >
                      <option value="">Chọn sản phẩm...</option>
                      {allProducts.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} (Gốc: {p.new_price || p.price} đ)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Giá Flash Sale"
                      value={productSalePrice}
                      onChange={(e) => setProductSalePrice(e.target.value)}
                      className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="SL mở bán (Quota)"
                      value={productQuota}
                      onChange={(e) => setProductQuota(e.target.value)}
                      className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      placeholder="Max/User"
                      value={productPerUserLimit}
                      onChange={(e) => setProductPerUserLimit(e.target.value)}
                      className="w-20 h-9 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                      title="Giới hạn số lượng mỗi khách được mua"
                    />
                    <button
                      type="submit"
                      className="flex-1 h-9 bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white font-semibold text-xs rounded-lg transition whitespace-nowrap px-2 cursor-pointer"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </form>

              {/* Items List */}
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Danh sách sản phẩm đang trong Sale ({detailData?.products?.length || 0})
                </span>

                {detailData?.products && detailData.products.length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {detailData.products.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          {item.product?.displayProduct?.[0] || item.product?.image ? (
                            <img
                              src={
                                item.product?.displayProduct?.[0] ||
                                item.product?.image
                              }
                              alt={item.product?.name || 'Sản phẩm'}
                              className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-[10px] border border-slate-200 dark:border-slate-700">
                              IMG
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item.product?.name || 'Sản phẩm'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Giá Sale: <strong className="text-[#05251C] dark:text-[#F5DD20]">{item.salePrice?.toLocaleString('vi-VN')} đ</strong> (Quota: {item.soldCount || 0}/{item.quota})
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveProductFromCampaign(item.product?._id || item.productId)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold"
                        >
                          Gỡ bỏ
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Chưa có sản phẩm nào trong chiến dịch này.
                  </div>
                )}
              </div>
            </div>
          )}
        </AdminModal>
      )}
    </div>
  );
};

export default CampaignManagement;
