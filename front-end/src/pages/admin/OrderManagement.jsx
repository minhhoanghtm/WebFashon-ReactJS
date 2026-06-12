import React, { useState } from "react";
import { Search, Eye, Filter, Edit3, X } from "lucide-react";
import { toast } from "react-toastify";

const initialOrders = [
  {
    id: "ORD-001",
    customer: "Sarah Johnson",
    amount: 249.99,
    status: "Shipped",
    date: "2024-06-08",
    items: [
      { name: "Áo khoác da cao cấp", quantity: 1, price: 249.99 }
    ]
  },
  {
    id: "ORD-002",
    customer: "Michael Chen",
    amount: 189.50,
    status: "Delivered",
    date: "2024-06-07",
    items: [
      { name: "Bốt da màu đen", quantity: 1, price: 149.99 },
      { name: "Áo thun trắng cổ điển", quantity: 1, price: 29.99 }
    ]
  },
  {
    id: "ORD-003",
    customer: "Emma Davis",
    amount: 342.80,
    status: "Pending",
    date: "2024-06-07",
    items: [
      { name: "Đầm hoa mùa hè", quantity: 3, price: 89.99 },
      { name: "Áo thun trắng cổ điển", quantity: 2, price: 29.99 }
    ]
  },
  {
    id: "ORD-004",
    customer: "James Wilson",
    amount: 156.20,
    status: "Processing",
    date: "2024-06-06",
    items: [
      { name: "Quần jeans xanh Denim", quantity: 2, price: 79.99 }
    ]
  },
  {
    id: "ORD-005",
    customer: "Lisa Anderson",
    amount: 428.60,
    status: "Shipped",
    date: "2024-05-06",
    items: [
      { name: "Áo khoác da cao cấp", quantity: 1, price: 299.99 },
      { name: "Đầm hoa mùa hè", quantity: 1, price: 89.99 }
    ]
  },
];

const statusTabs = [
  { key: "All", label: "Tất cả" },
  { key: "Pending", label: "Chờ xử lý" },
  { key: "Processing", label: "Đang xử lý" },
  { key: "Shipped", label: "Đang giao" },
  { key: "Delivered", label: "Đã giao" },
];

const getStatusStyles = (status) => {
  const styles = {
    Pending: "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
    Processing: "bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600/20",
    Shipped: "bg-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-600/20",
    Delivered: "bg-green-600/10 text-green-600 dark:text-green-400 border-green-600/20",
  };
  return styles[status] || "bg-slate-500/10 text-slate-500 border-slate-500/20";
};

const getStatusLabel = (status) => {
  const labels = {
    Pending: "Chờ xử lý",
    Processing: "Đang xử lý",
    Shipped: "Đang giao hàng",
    Delivered: "Đã giao hàng",
  };
  return labels[status] || status;
};

const OrderManagement = () => {
  const [orders, setOrders] = useState(initialOrders);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filter & Search
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "All" || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = (orderId, newStatus) => {
    setOrders(
      orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    toast.success(`Đã cập nhật trạng thái đơn hàng sang: ${getStatusLabel(newStatus)}`);
  };

  return (
    <div className="space-y-8 relative">
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
          
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã đơn hoặc khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Status Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          {statusTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition shadow-sm border ${
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
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    {/* Order ID */}
                    <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400 font-semibold">
                      {order.id}
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-200">
                      {order.customer}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-slate-950 dark:text-slate-100">
                      ${order.amount.toFixed(2)}
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
                      {order.date}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* View details */}
                        <button
                          onClick={() => handleOpenDetails(order)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-700 transition"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                        
                        {/* Change status select dropdown */}
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleUpdateStatus(order.id, e.target.value)
                          }
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 dark:text-slate-300"
                        >
                          <option value="Pending">Chờ xử lý</option>
                          <option value="Processing">Đang xử lý</option>
                          <option value="Shipped">Đang giao</option>
                          <option value="Delivered">Đã giao</option>
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
      </div>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>Chi tiết đơn hàng</span>
                <span className="font-mono text-blue-500">{selectedOrder.id}</span>
              </h3>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
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
                    {selectedOrder.customer}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">
                    Ngày đặt hàng
                  </span>
                  <span className="font-semibold text-slate-850 dark:text-slate-200">
                    {selectedOrder.date}
                  </span>
                </div>
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
                    Tổng giá trị thanh toán
                  </span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 text-lg">
                    ${selectedOrder.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                <span className="text-xs text-slate-400 font-bold uppercase block">
                  Danh sách sản phẩm mua
                </span>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-800">
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      <span className="truncate max-w-[250px]">{item.name}</span>
                      <span>
                        x{item.quantity} - <span className="font-bold">${item.price.toFixed(2)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Status actions */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                <span className="text-xs text-slate-400 font-bold uppercase block">
                  Cập nhật trạng thái nhanh
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {["Pending", "Processing", "Shipped", "Delivered"].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center border transition ${
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
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-md transition"
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
