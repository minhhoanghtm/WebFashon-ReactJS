import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  MapPin,
  Phone,
  User,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getAdminOrdersService,
  updateOrderStatusService,
} from '@/services/order.service';
import { getOrderItemsByOrderIdService } from '@/services/orderItem.service';
import { formatCurrency } from '@/utils/format';
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

const statusTabs = [
  { key: 'All', label: 'Tất cả đơn' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'shipping', label: 'Đang giao' },
  { key: 'delivered', label: 'Đã giao' },
  { key: 'cancelled', label: 'Đã hủy' },
];

const getStatusBadge = (status) => {
  const map = {
    pending: { label: 'Chờ xử lý', variant: 'warning' },
    confirmed: { label: 'Đã xác nhận', variant: 'info' },
    shipping: { label: 'Đang giao', variant: 'info' },
    shipped: { label: 'Đang giao', variant: 'info' },
    delivered: { label: 'Đã giao', variant: 'success' },
    cancelled: { label: 'Đã hủy', variant: 'danger' },
  };

  const item = map[status] || { label: status || 'Không rõ', variant: 'neutral' };
  return (
    <AdminBadge variant={item.variant} dot size="sm">
      {item.label}
    </AdminBadge>
  );
};

const OrderManagement = () => {
  useDocumentTitle('Quản lý đơn hàng — 404Studio Admin');
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.page,
        limit: 10,
        search: search || undefined,
      };
      if (activeTab !== 'All') {
        params.status = activeTab;
      }
      const data = await getAdminOrdersService(params);
      setOrders(data.items || []);
      setPagination(
        data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
      );
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError('Không thể tải danh sách đơn hàng từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab, pagination.page, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearch(searchInput.trim());
  };

  const handleOpenDetails = async (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
    setOrderItems([]);
    try {
      setLoadingItems(true);
      const res = await getOrderItemsByOrderIdService(order._id);
      const itemsList = res.data || res || [];
      setOrderItems(itemsList);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách sản phẩm trong đơn hàng.');
    } finally {
      setLoadingItems(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await updateOrderStatusService(orderId, newStatus);
      toast.success('Cập nhật trạng thái đơn hàng thành công!');
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o._id === orderId ? { ...o, status: newStatus } : o
        )
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật trạng thái đơn hàng!');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <AdminPageHeader
        title="Quản lý đơn hàng"
        description="Tra cứu tiến độ giao nhận, xác thực giao dịch thanh toán và cập nhật trạng thái đơn hàng"
        breadcrumbs={[{ label: 'Đơn hàng' }]}
        actions={
          <button
            onClick={fetchOrders}
            aria-label="Làm mới danh sách"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />

      {/* Main Card */}
      <AdminCard noPadding>
        {/* Status Tabs Bar */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {statusTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-[#05251C] text-white dark:bg-[#F5DD20] dark:text-[#05251C] shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Mã đơn hoặc tên khách..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30"
            />
          </form>
        </div>

        {/* Content Body */}
        {loading && orders.length === 0 ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</p>
            <button
              onClick={fetchOrders}
              className="text-xs font-bold text-[#05251C] dark:text-[#F5DD20] hover:underline"
            >
              Tải lại trang
            </button>
          </div>
        ) : orders.length === 0 ? (
          <AdminEmptyState
            icon={ShoppingBag}
            title={search || activeTab !== 'All' ? 'Không tìm thấy đơn hàng' : 'Chưa có đơn hàng nào'}
            description={
              search
                ? `Không có kết quả nào trùng với từ khóa "${search}".`
                : 'Chưa có đơn hàng nào được ghi nhận trong khoảng thời gian này.'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Mã đơn hàng</th>
                    <th className="px-6 py-3.5">Khách hàng</th>
                    <th className="px-6 py-3.5">Tổng tiền</th>
                    <th className="px-6 py-3.5">Trạng thái</th>
                    <th className="px-6 py-3.5">Ngày đặt</th>
                    <th className="px-6 py-3.5 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Code */}
                      <td className="px-6 py-3.5">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {order._id}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {order.shipping_address?.full_name || 'Khách vãng lai'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {order.shipping_address?.phone || 'Chưa có SĐT'}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(order.total_price || 0)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5">{getStatusBadge(order.status)}</td>

                      {/* Date */}
                      <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        <span className="block text-[10px] text-slate-400">
                          {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenDetails(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                          <span>Xem</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <AdminPagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </AdminCard>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <AdminModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Chi tiết đơn hàng #${selectedOrder._id.slice(-6).toUpperCase()}`}
          description={`Ngày tạo: ${new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}`}
          size="2xl"
          footer={
            <button
              onClick={() => setIsDetailOpen(false)}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
          }
        >
          <div className="space-y-6">
            {/* Status Stepper Summary */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Trạng thái hiện tại:
                </span>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Status Update Actions */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="block text-[11px] font-semibold text-slate-500 mb-2">
                  Cập nhật trạng thái đơn:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { key: 'pending', label: 'Chờ xử lý' },
                    { key: 'confirmed', label: 'Xác nhận' },
                    { key: 'shipping', label: 'Giao hàng' },
                    { key: 'delivered', label: 'Đã giao' },
                    { key: 'cancelled', label: 'Hủy đơn' },
                  ].map((st) => (
                    <button
                      key={st.key}
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder._id, st.key)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl transition border cursor-pointer ${
                        selectedOrder.status === st.key
                          ? 'bg-[#05251C] text-white border-[#05251C] dark:bg-[#F5DD20] dark:text-[#05251C] dark:border-[#F5DD20] shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <User className="h-4 w-4 text-[#05251C] dark:text-[#F5DD20]" />
                  <span>Người nhận hàng</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {selectedOrder.shipping_address?.full_name || 'Khách vãng lai'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{selectedOrder.shipping_address?.phone || 'Chưa có SĐT'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <MapPin className="h-4 w-4 text-[#05251C] dark:text-[#F5DD20]" />
                  <span>Địa chỉ giao hàng</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedOrder.shipping_address
                    ? `${selectedOrder.shipping_address.address_detail}, ${selectedOrder.shipping_address.ward}, ${selectedOrder.shipping_address.district}, ${selectedOrder.shipping_address.city}`
                    : 'Chưa có địa chỉ cụ thể'}
                </p>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Sản phẩm trong đơn hàng
              </h4>

              {loadingItems ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Đang tải danh sách sản phẩm...
                </div>
              ) : orderItems.length > 0 ? (
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {orderItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-400">
                          #{idx + 1}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.product_name || 'Sản phẩm thời trang'}
                          </span>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Số lượng: <strong className="text-slate-700 dark:text-slate-200">{item.quantity}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency((item.price || 0) * (item.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Không tìm thấy chi tiết sản phẩm.
                </div>
              )}

              {/* Order Totals Summary */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tổng thanh toán cuối cùng:
                </span>
                <span className="text-lg font-extrabold text-[#05251C] dark:text-[#F5DD20] tabular-nums">
                  {formatCurrency(selectedOrder.total_price || 0)}
                </span>
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
};

export default OrderManagement;
