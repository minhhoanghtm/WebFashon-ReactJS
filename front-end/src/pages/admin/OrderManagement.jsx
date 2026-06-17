import React, { useState, useEffect } from "react";
import { Search, Eye, X, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { getAdminOrdersService, updateOrderStatusService } from "@/services/order.service";
import { getOrderItemsByOrderIdService } from "@/services/orderItem.service";

const statusTabs = [
  { key: "All", label: "Tất cả" },
  { key: "pending", label: "Chờ xử lý" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "shipping", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "cancelled", label: "Đã hủy" },
];

const getStatusStyles = (status) => {
  const styles = {
    pending: "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
    confirmed: "bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600/20",
    shipping: "bg-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-600/20",
    shipped: "bg-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-600/20",
    delivered: "bg-green-600/10 text-green-600 dark:text-green-400 border-green-600/20",
    cancelled: "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20",
  };
  return styles[status] || "bg-slate-500/10 text-slate-500 border-slate-500/20";
};

const getStatusLabel = (status) => {
  const labels = {
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao hàng",
    shipped: "Đang giao hàng",
    delivered: "Đã giao hàng",
    cancelled: "Đã hủy",
  };
  return labels[status] || status;
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.page,
        limit: 10,
        search: search || undefined,
      };
      if (activeTab !== "All") {
        params.status = activeTab;
      }
      const data = await getAdminOrdersService(params);
      setOrders(data.items || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError("Không thể tải danh sách đơn hàng từ backend.");
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
    setSearch(searchInput);
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
      toast.error("Không thể tải danh sách sản phẩm của đơn hàng");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatusService(orderId, newStatus);
      toast.success(`Đã cập nhật trạng thái đơn hàng sang: ${getStatusLabel(newStatus)}`);
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể cập nhật trạng thái đơn hàng!");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-slate-500">Đang tải danh sách đơn hàng từ backend...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Không thể kết nối API</h3>
        <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
        <button
          onClick={fetchOrders}
          className="bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-6 py-2 rounded-xl transition cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative text-left">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quản lý đơn hàng</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Quản lý hoạt động kinh doanh thương mại điện tử thời trang của bạn
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6 transition-all duration-300">
        
        {/* Section Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight">Danh sách đơn hàng</h2>
          
          <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã đơn hoặc người mua..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </form>
        </div>

        {/* Status Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          {statusTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition shadow-sm border cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-blue-500/10"
                    : "bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Mã đơn hàng</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày đặt</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    {/* Order ID */}
                    <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400 font-semibold truncate max-w-[150px]">
                      {order._id}
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-200">
                      {order.shipping_address?.full_name || "Khách vãng lai"}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-slate-950 dark:text-slate-100">
                      ${(order.total_price || 0).toFixed(2)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* View details */}
                        <button
                          onClick={() => handleOpenDetails(order)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-700 transition cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                        
                        {/* Change status select dropdown */}
                        <select
                          value={order.status === "shipping" ? "shipping" : order.status}
                          onChange={(e) =>
                            handleUpdateStatus(order._id, e.target.value)
                          }
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          <option value="pending">Chờ xử lý</option>
                          <option value="confirmed">Đã xác nhận</option>
                          <option value="shipping">Đang giao</option>
                          <option value="delivered">Đã giao</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    Không tìm thấy đơn hàng nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
            <span className="text-xs text-slate-400">
              Trang {pagination.page} trên {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>Chi tiết đơn hàng</span>
                <span className="font-mono text-blue-500 text-sm truncate max-w-[200px]">{selectedOrder._id}</span>
              </h3>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">
                    Khách hàng
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {selectedOrder.shipping_address?.full_name || "Khách vãng lai"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">
                    Số điện thoại
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {selectedOrder.shipping_address?.phone || "Chưa cung cấp"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase block">
                  Địa chỉ nhận hàng
                </span>
                <p className="text-sm text-slate-650 dark:text-slate-350">
                  {selectedOrder.shipping_address
                    ? `${selectedOrder.shipping_address.address_detail}, ${selectedOrder.shipping_address.ward}, ${selectedOrder.shipping_address.district}, ${selectedOrder.shipping_address.city}`
                    : "Chưa xác định"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">
                    Trạng thái
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 mt-0.5 rounded-full text-xs font-bold border ${getStatusStyles(
                      selectedOrder.status
                    )}`}
                  >
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">
                    Tổng thanh toán
                  </span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 text-lg">
                    ${(selectedOrder.total_price || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                <span className="text-xs text-slate-400 font-bold uppercase block">
                  Danh sách sản phẩm mua
                </span>
                {loadingItems ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-800">
                    {orderItems.length > 0 ? (
                      orderItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300"
                        >
                          <span className="truncate max-w-[250px]">{item.product_name || "Sản phẩm thời trang"}</span>
                          <span>
                            x{item.quantity} - <span className="font-bold">${(item.price || 0).toFixed(2)}</span>
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center">Không tìm thấy sản phẩm trong đơn hàng này.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Status actions */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                <span className="text-xs text-slate-400 font-bold uppercase block">
                  Cập nhật trạng thái nhanh
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {["pending", "confirmed", "shipping", "delivered", "cancelled"].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedOrder._id, st)}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center border cursor-pointer transition ${
                        selectedOrder.status === st
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {getStatusLabel(st).replace(" hàng", "")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-md transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
