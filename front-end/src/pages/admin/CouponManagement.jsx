import React, { useState, useEffect } from "react";
import { Ticket, Search, Plus, Edit, Trash2, X, Eye, EyeOff, Loader2, ArrowUpDown } from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import voucherApi from "../../api/voucher.api";
import { getAllProductService } from "@/services/product.service";
import { getAllCategoriesService } from "@/services/category.service";
import useWebsiteSettings from "@/hooks/useWebsiteSettings";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const CouponManagement = () => {
   const { settings } = useWebsiteSettings();
    const general = settings?.general || {};
    const siteName = general.siteName || "";
    useDocumentTitle("Quản lý mã giảm giá");
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter & Pagination states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
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

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDiscountType, setFormDiscountType] = useState("percentage");
  const [formDiscountValue, setFormDiscountValue] = useState("");
  const [formMaxDiscountAmount, setFormMaxDiscountAmount] = useState("");
  const [formMinOrderValue, setFormMinOrderValue] = useState("");
  const [formTotalQuantity, setFormTotalQuantity] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [formVoucherType, setFormVoucherType] = useState("order");
  const [formApplicableProducts, setFormApplicableProducts] = useState([]);
  const [formApplicableCategories, setFormApplicableCategories] = useState([]);

  // Master lists
  const [allProducts, setAllProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  useEffect(() => {
    const loadProductsAndCategories = async () => {
      try {
        const [prods, cats] = await Promise.all([
          getAllProductService(),
          getAllCategoriesService()
        ]);
        setAllProducts(prods || []);
        setAllCategories(cats || []);
      } catch (err) {
        console.error("Failed to load products/categories:", err);
      }
    };
    loadProductsAndCategories();
  }, []);

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
        setVouchers(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi tải danh sách voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [page, search, status, discountType, sortBy, sortOrder]);

  const handleOpenAddModal = () => {
    setFormCode("");
    setFormName("");
    setFormDescription("");
    setFormDiscountType("percentage");
    setFormDiscountValue("");
    setFormMaxDiscountAmount("");
    setFormMinOrderValue("");
    setFormTotalQuantity("");
    setFormVoucherType("order");
    setFormApplicableProducts([]);
    setFormApplicableCategories([]);
    
    // Set default dates: start now, end in 7 days
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    setFormStartDate(today.toISOString().split("T")[0]);
    setFormEndDate(nextWeek.toISOString().split("T")[0]);
    setFormStatus("ACTIVE");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (v) => {
    setCurrentVoucherId(v._id);
    setFormCode(v.code);
    setFormName(v.name);
    setFormDescription(v.description || "");
    setFormDiscountType(v.discountType);
    setFormDiscountValue(v.discountValue);
    setFormMaxDiscountAmount(v.maxDiscountAmount || "");
    setFormMinOrderValue(v.minOrderValue || "");
    setFormTotalQuantity(v.totalQuantity);
    setFormVoucherType(v.voucherType || "order");
    setFormApplicableProducts(v.applicableProducts || []);
    setFormApplicableCategories(v.applicableCategories || []);
    
    setFormStartDate(new Date(v.startDate).toISOString().split("T")[0]);
    setFormEndDate(new Date(v.endDate).toISOString().split("T")[0]);
    setFormStatus(v.status);
    setIsEditModalOpen(true);
  };

  const validateForm = () => {
    if (!formCode.trim()) {
      toast.error("Mã code voucher không được để trống!");
      return false;
    }
    if (!formName.trim()) {
      toast.error("Tên voucher không được để trống!");
      return false;
    }
    if (!formDiscountValue || Number(formDiscountValue) <= 0) {
      toast.error("Giá trị giảm giá phải lớn hơn 0!");
      return false;
    }
    if (formDiscountType === "percentage" && Number(formDiscountValue) > 100) {
      toast.error("Phần trăm giảm giá không thể lớn hơn 100%!");
      return false;
    }
    if (!formTotalQuantity || Number(formTotalQuantity) <= 0) {
      toast.error("Tổng số lượng voucher phải lớn hơn 0!");
      return false;
    }
    if (!formStartDate || !formEndDate) {
      toast.error("Vui lòng chọn ngày bắt đầu và kết thúc!");
      return false;
    }
    if (new Date(formEndDate) <= new Date(formStartDate)) {
      toast.error("Ngày kết thúc phải lớn hơn ngày bắt đầu!");
      return false;
    }
    if (formVoucherType === "product" && formApplicableProducts.length === 0 && formApplicableCategories.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm hoặc danh mục áp dụng!");
      return false;
    }
    return true;
  };

  const handleAddVoucher = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        description: formDescription.trim(),
        discountType: formDiscountType,
        discountValue: Number(formDiscountValue),
        maxDiscountAmount: formDiscountType === "percentage" ? Number(formMaxDiscountAmount) || 0 : 0,
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
        toast.success("Thêm voucher mới thành công!");
        setIsAddModalOpen(false);
        fetchVouchers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi thêm voucher");
    }
  };

  const handleEditVoucher = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
        toast.success("Cập nhật voucher thành công!");
        setIsEditModalOpen(false);
        fetchVouchers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật voucher");
    }
  };

  const handleDeleteVoucher = async (id, code) => {
    const result = await Swal.fire({
      title: "Bạn có chắc chắn muốn xóa?",
      text: `Voucher ${code} sẽ bị xóa mềm khỏi hệ thống.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        const res = await voucherApi.deleteVoucher(id);
        if (res.success) {
          toast.success(`Đã xóa voucher ${code}`);
          fetchVouchers();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Lỗi khi xóa voucher");
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const res = await voucherApi.toggleVoucherStatus(id);
      if (res.success) {
        toast.success("Thay đổi trạng thái voucher thành công!");
        fetchVouchers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi đổi trạng thái voucher");
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-8 relative font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quản lý mã giảm giá</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Thiết lập, theo dõi và cấu hình các chương trình khuyến mãi cho PetShop
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo code hoặc tên..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Tạm ẩn</option>
          </select>

          {/* Type filter */}
          <select
            value={discountType}
            onChange={(e) => {
              setDiscountType(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tất cả loại giảm</option>
            <option value="percentage">Giảm theo %</option>
            <option value="fixed">Số tiền cố định</option>
          </select>
        </div>

        {/* Add Button */}
        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Tạo Voucher</span>
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4 transition-all duration-300">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Danh sách khuyến mãi</h2>
          <span className="text-xs text-slate-400">
            Tổng số: {pagination.total} voucher
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm text-slate-400">Đang tải danh sách voucher...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 rounded-xl">
            <Ticket className="h-12 w-12 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-500">Không tìm thấy voucher nào</p>
            <p className="text-xs text-slate-400">Hãy thử thay đổi điều kiện lọc hoặc tạo mới voucher</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80 text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort("code")}>
                      Mã / Tên <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                    <th className="px-6 py-4">Loại giảm</th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort("discountValue")}>
                      Giá trị <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                    <th className="px-6 py-4">Đơn tối thiểu</th>
                    <th className="px-6 py-4">Số lượng (Đã dùng/Còn)</th>
                    <th className="px-6 py-4">Hạn dùng</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {vouchers.map((v) => {
                    const isExpired = new Date(v.endDate) < new Date();
                    return (
                      <tr key={v._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded text-xs font-mono font-bold">
                              {v.code}
                            </span>
                            <div className="text-slate-800 dark:text-slate-200 text-sm font-semibold max-w-[200px] truncate">
                              {v.name}
                            </div>
                            <div className="text-slate-850 dark:text-slate-350 text-[10px] font-bold mt-1">
                              {v.voucherType === "shipping" ? (
                                <span className="text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-1 py-0.5 rounded">Vận chuyển</span>
                              ) : v.voucherType === "product" ? (
                                <span className="text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 px-1 py-0.5 rounded font-medium">Sản phẩm ({v.applicableProducts?.length || 0} SP / {v.applicableCategories?.length || 0} DM)</span>
                              ) : (
                                <span className="text-slate-600 bg-slate-100 dark:bg-slate-900/60 dark:text-slate-400 px-1 py-0.5 rounded">Đơn hàng</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {v.discountType === "percentage" ? (
                            <span className="text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-1 rounded-lg text-xs">
                              Phần trăm (%)
                            </span>
                          ) : (
                            <span className="text-green-600 bg-green-50 dark:bg-green-950/40 dark:text-green-400 px-2 py-1 rounded-lg text-xs">
                              Cố định (đ)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5 text-slate-900 dark:text-slate-100 font-bold">
                            {v.discountType === "percentage" ? (
                              <span>{v.discountValue}%</span>
                            ) : (
                              <span>{v.discountValue.toLocaleString("vi-VN")}đ</span>
                            )}
                            {v.discountType === "percentage" && v.maxDiscountAmount > 0 && (
                              <div className="text-[10px] text-slate-400 font-normal">
                                Tối đa: {v.maxDiscountAmount.toLocaleString("vi-VN")}đ
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                          {v.minOrderValue > 0 ? `${v.minOrderValue.toLocaleString("vi-VN")}đ` : "0đ"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-xs text-slate-600 dark:text-slate-300">
                              Tổng: <span className="font-bold">{v.totalQuantity}</span>
                            </div>
                            <div className="text-xs text-slate-400">
                              Dùng: <span className="text-indigo-600 font-semibold">{v.usedQuantity}</span> | Còn: <span className="text-emerald-600 font-semibold">{v.remainingQuantity}</span>
                            </div>
                            {/* Tiny progress bar */}
                            <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${(v.claimedQuantity / v.totalQuantity) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs space-y-0.5">
                            <div className="text-slate-500">
                              Bắt đầu: {new Date(v.startDate).toLocaleDateString("vi-VN")}
                            </div>
                            <div className={`font-semibold ${isExpired ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}>
                              Hết hạn: {new Date(v.endDate).toLocaleDateString("vi-VN")}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isExpired ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                              Hết hạn
                            </span>
                          ) : v.status === "ACTIVE" ? (
                            <button
                              onClick={() => toggleStatus(v._id, v.status)}
                              className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:opacity-80 transition cursor-pointer"
                            >
                              Hoạt động
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleStatus(v._id, v.status)}
                              className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-900/60 dark:text-slate-400 hover:opacity-80 transition cursor-pointer"
                            >
                              Tạm ẩn
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(v)}
                              className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVoucher(v._id, v.code)}
                              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Xóa mềm"
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

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">
                  Trang {pagination.page} trên {pagination.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition disabled:opacity-40 cursor-pointer"
                  >
                    Trước
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        page === i + 1
                          ? "bg-indigo-600 text-white"
                          : "border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition disabled:opacity-40 cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal - Add Voucher */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl p-6 shadow-2xl flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            {/* Form Column */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xl font-bold tracking-tight">Tạo Voucher Khuyến Mãi</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddVoucher} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mã Voucher *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: WEEKEND15"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tên Voucher *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Giảm giá ngày cuối tuần"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mô tả chi tiết</label>
                  <textarea
                    rows={2}
                    placeholder="Voucher áp dụng giảm giá cho tất cả sản phẩm trong cửa hàng..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Loại Voucher *</label>
                    <select
                      value={formVoucherType}
                      onChange={(e) => {
                        setFormVoucherType(e.target.value);
                        if (e.target.value !== "product") {
                          setFormApplicableProducts([]);
                          setFormApplicableCategories([]);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="order">Giảm đơn hàng</option>
                      <option value="product">Giảm sản phẩm/danh mục</option>
                      <option value="shipping">Phí vận chuyển</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Loại giảm giá</label>
                    <select
                      value={formDiscountType}
                      onChange={(e) => {
                        setFormDiscountType(e.target.value);
                        setFormDiscountValue("");
                        setFormMaxDiscountAmount("");
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="percentage">Phần trăm (%)</option>
                      <option value="fixed">Số tiền cố định (đ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Mức giảm ({formDiscountType === "percentage" ? "%" : "VNĐ"}) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={formDiscountType === "percentage" ? 100 : undefined}
                      placeholder={formDiscountType === "percentage" ? "Ví dụ: 15" : "Ví dụ: 50000"}
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Giảm tối đa ({formDiscountType === "percentage" ? "VNĐ" : "N/A"})
                    </label>
                    <input
                      type="number"
                      disabled={formDiscountType === "fixed"}
                      placeholder={formDiscountType === "fixed" ? "Không khả dụng" : "0: Không giới hạn"}
                      value={formMaxDiscountAmount}
                      onChange={(e) => setFormMaxDiscountAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40"
                    />
                  </div>
                </div>

                {formVoucherType === "product" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Sản phẩm áp dụng ({formApplicableProducts.length} đã chọn)
                      </label>
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                        {allProducts.map((p) => {
                          const isChecked = formApplicableProducts.includes(p._id);
                          return (
                            <label key={p._id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setFormApplicableProducts((prev) =>
                                    isChecked ? prev.filter((id) => id !== p._id) : [...prev, p._id]
                                  );
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="truncate">{p.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Danh mục áp dụng ({formApplicableCategories.length} đã chọn)
                      </label>
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                        {allCategories.map((c) => {
                          const isChecked = formApplicableCategories.includes(c._id);
                          return (
                            <label key={c._id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setFormApplicableCategories((prev) =>
                                    isChecked ? prev.filter((id) => id !== c._id) : [...prev, c._id]
                                  );
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="truncate">{c.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Đơn tối thiểu (VNĐ)</label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 150000"
                      value={formMinOrderValue}
                      onChange={(e) => setFormMinOrderValue(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng số lượng phát hành *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="Ví dụ: 100"
                      value={formTotalQuantity}
                      onChange={(e) => setFormTotalQuantity(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Trạng thái khởi tạo</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="ACTIVE">Kích hoạt ngay</option>
                      <option value="INACTIVE">Tạm ẩn</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ngày bắt đầu *</label>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ngày kết thúc *</label>
                    <input
                      type="date"
                      required
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-semibold transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-md shadow-indigo-500/20 cursor-pointer"
                  >
                    Tạo voucher
                  </button>
                </div>
              </form>
            </div>

            {/* Preview Card Column */}
            <div className="w-full md:w-80 flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Realtime Preview</h4>
              <div className="w-full bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600">
                    <Ticket className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded w-fit">
                      {formCode || "MÃCODE30"}
                    </div>
                    <div className="text-xs text-slate-400">Hạn dùng: {formEndDate ? new Date(formEndDate).toLocaleDateString("vi-VN") : "chưa thiết lập"}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                    {formName || "Tên Voucher"}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {formDescription || "Thông tin mô tả các điều kiện áp dụng cho voucher..."}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between items-baseline">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Mức giảm giá</div>
                    <div className="text-2xl font-black text-indigo-600">
                      {formDiscountValue ? (
                        formDiscountType === "percentage" ? `${formDiscountValue}%` : `${Number(formDiscountValue).toLocaleString("vi-VN")}đ`
                      ) : "0đ"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Đơn tối thiểu</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {formMinOrderValue ? `${Number(formMinOrderValue).toLocaleString("vi-VN")}đ` : "0đ"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Edit Voucher */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl p-6 shadow-2xl flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            {/* Form Column */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xl font-bold tracking-tight">Cấu Hình Voucher: {formCode}</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditVoucher} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mã Voucher (Không được sửa)</label>
                    <input
                      type="text"
                      disabled
                      value={formCode}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-500 opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tên Voucher *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mô tả chi tiết</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Loại giảm giá (Không được sửa)</label>
                    <select
                      disabled
                      value={formDiscountType}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-500 opacity-70 cursor-not-allowed"
                    >
                      <option value="percentage">Phần trăm (%)</option>
                      <option value="fixed">Số tiền cố định (đ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mức giảm (Không được sửa)</label>
                    <input
                      type="number"
                      disabled
                      value={formDiscountValue}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-500 opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Giảm tối đa (Không được sửa)</label>
                    <input
                      type="number"
                      disabled
                      value={formMaxDiscountAmount || 0}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-500 opacity-70 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Loại Voucher *</label>
                    <select
                      value={formVoucherType}
                      onChange={(e) => {
                        setFormVoucherType(e.target.value);
                        if (e.target.value !== "product") {
                          setFormApplicableProducts([]);
                          setFormApplicableCategories([]);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="order">Giảm đơn hàng</option>
                      <option value="product">Giảm sản phẩm/danh mục</option>
                      <option value="shipping">Phí vận chuyển</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Đơn tối thiểu (Không được sửa)</label>
                    <input
                      type="number"
                      disabled
                      value={formMinOrderValue || 0}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-500 opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng số lượng phát hành *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formTotalQuantity}
                      onChange={(e) => setFormTotalQuantity(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Trạng thái hoạt động</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                      <option value="INACTIVE">Tạm ẩn (INACTIVE)</option>
                    </select>
                  </div>
                </div>

                {formVoucherType === "product" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Sản phẩm áp dụng ({formApplicableProducts.length} đã chọn)
                      </label>
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                        {allProducts.map((p) => {
                          const isChecked = formApplicableProducts.includes(p._id);
                          return (
                            <label key={p._id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setFormApplicableProducts((prev) =>
                                    isChecked ? prev.filter((id) => id !== p._id) : [...prev, p._id]
                                  );
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="truncate">{p.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Danh mục áp dụng ({formApplicableCategories.length} đã chọn)
                      </label>
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                        {allCategories.map((c) => {
                          const isChecked = formApplicableCategories.includes(c._id);
                          return (
                            <label key={c._id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setFormApplicableCategories((prev) =>
                                    isChecked ? prev.filter((id) => id !== c._id) : [...prev, c._id]
                                  );
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="truncate">{c.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ngày bắt đầu (Không được sửa)</label>
                    <input
                      type="date"
                      disabled
                      value={formStartDate}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-500 opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ngày kết thúc *</label>
                    <input
                      type="date"
                      required
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-semibold transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>

            {/* Preview Card Column */}
            <div className="w-full md:w-80 flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Realtime Preview</h4>
              <div className="w-full bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded w-fit">
                      {formCode}
                    </div>
                    <div className="text-xs text-slate-400">Hạn dùng: {formEndDate ? new Date(formEndDate).toLocaleDateString("vi-VN") : "chưa thiết lập"}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                    {formName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {formDescription || "Thông tin mô tả các điều kiện áp dụng cho voucher..."}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between items-baseline">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Mức giảm giá</div>
                    <div className="text-2xl font-black text-indigo-600">
                      {formDiscountValue ? (
                        formDiscountType === "percentage" ? `${formDiscountValue}%` : `${Number(formDiscountValue).toLocaleString("vi-VN")}đ`
                      ) : "0đ"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Đơn tối thiểu</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {formMinOrderValue ? `${Number(formMinOrderValue).toLocaleString("vi-VN")}đ` : "0đ"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CouponManagement
