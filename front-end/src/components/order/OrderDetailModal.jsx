import React, { useEffect } from "react";
import { X, MapPin, CreditCard, ShoppingBag, Clock } from "lucide-react";
import OrderItem from "./OrderItem";
import OrderTimeline from "./OrderTimeline";
import { formatCurrency, formatDate } from "@/utils/format";

const paymentMethodMap = {
  cod: "Thanh toán khi nhận hàng (COD)",
  momo: "Thanh toán qua Ví MoMo",
  vnpay: "Thanh toán qua VNPay",
};

const paymentStatusMap = {
  pending: { label: "Chờ thanh toán", className: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  paid: { label: "Đã thanh toán", className: "bg-green-50 text-green-700 border-green-100" },
  failed: { label: "Thanh toán thất bại", className: "bg-red-50 text-red-700 border-red-100" },
};

const orderStatusMap = {
  pending: { label: "Chờ xác nhận", className: "bg-orange-50 text-orange-700 border-orange-100" },
  confirmed: { label: "Chờ lấy hàng", className: "bg-blue-50 text-blue-700 border-blue-100" },
  shipping: { label: "Chờ giao hàng", className: "bg-purple-50 text-purple-700 border-purple-100" },
  delivered: { label: "Đã giao thành công", className: "bg-green-50 text-green-700 border-green-100" },
  cancelled: { label: "Đã hủy", className: "bg-red-50 text-red-700 border-red-100" },
};

const OrderDetailModal = ({ isOpen, onClose, order }) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !order) return null;

  const addr = order.shipping_address || {};
  const fullAddress = [
    addr.address_detail,
    addr.ward,
    addr.district,
    addr.city,
  ].filter(Boolean).join(", ");

  const payStatus = paymentStatusMap[order.payment_status] || { label: order.payment_status, className: "bg-gray-50 text-gray-700 border-gray-100" };
  const ordStatus = orderStatusMap[order.status] || { label: order.status, className: "bg-gray-50 text-gray-700 border-gray-100" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-none sm:rounded-2xl shadow-2xl flex flex-col max-h-screen sm:max-h-[90vh] overflow-hidden z-10 animate-slideUp border border-gray-100">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>Chi tiết đơn hàng</span>
              <span className="text-xs font-normal text-gray-400">#{order._id}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Đặt ngày {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
          
          {/* Main info grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Delivery address */}
            <div className="bg-white border border-gray-100 p-5 rounded-xl space-y-3 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                Địa chỉ giao hàng
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-950">{addr.full_name}</p>
                <p>SĐT: {addr.phone}</p>
                <p className="leading-relaxed">{fullAddress || "Chưa cập nhật địa chỉ"}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white border border-gray-100 p-5 rounded-xl space-y-3 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                Thanh toán
              </h3>
              <div className="space-y-2.5">
                <div>
                  <p className="text-xs text-gray-400">Phương thức</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">
                    {paymentMethodMap[order.payment_method] || order.payment_method}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Trạng thái</p>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${payStatus.className}`}>
                    {payStatus.label}
                  </span>
                </div>
              </div>
            </div>

            {/* General Status */}
            <div className="bg-white border border-gray-100 p-5 rounded-xl space-y-3 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Đơn hàng
              </h3>
              <div className="space-y-2.5">
                <div>
                  <p className="text-xs text-gray-400">Tổng thanh toán</p>
                  <p className="text-base font-bold text-gray-950 mt-0.5">
                    {formatCurrency(order.total_price)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Trạng thái vận chuyển</p>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${ordStatus.className}`}>
                    {ordStatus.label}
                  </span>
                </div>
              </div>
            </div>

          </div>

          <hr className="border-gray-100" />

          {/* Timeline and products */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Left: Product List */}
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-gray-400" />
                Sản phẩm đã mua
              </h3>
              <div className="border border-gray-100 rounded-xl px-5 divide-y divide-gray-100 bg-white shadow-sm">
                {order.items?.map((item) => (
                  <OrderItem key={item._id} item={item} />
                ))}
              </div>
            </div>

            {/* Right: Timeline Stepper */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Hành trình đơn hàng
              </h3>
              <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                <OrderTimeline order={order} />
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-black hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderDetailModal;
