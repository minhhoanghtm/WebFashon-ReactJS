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
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
};

const orderStatusMap = {
  pending: "Chờ xác nhận",
  confirmed: "Chờ lấy hàng",
  shipping: "Đang giao hàng",
  delivered: "Đã giao thành công",
  cancelled: "Đã hủy",
};

const OrderDetailModal = ({ isOpen, onClose, order }) => {
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !order) return null;

  const addr = order.shipping_address || {};
  const fullAddress = [addr.address_detail, addr.ward, addr.district, addr.city]
    .filter(Boolean)
    .join(", ");

  const payStatusLabel =
    paymentStatusMap[order.payment_status] || order.payment_status;
  const ordStatusLabel = orderStatusMap[order.status] || order.status;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] flex flex-col max-h-screen sm:max-h-[90vh] overflow-hidden z-10">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <div>
            <h2
              id="order-detail-modal-title"
              className="font-display text-lg font-semibold flex items-center gap-2"
            >
              <span>Chi tiết đơn hàng</span>
              <span className="text-xs font-mono font-normal text-[var(--color-text-muted)]">
                #{order._id}
              </span>
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Đặt ngày {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết đơn hàng"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center border border-transparent hover:border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Main info grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Delivery address */}
            <div className="border border-[var(--color-border)] p-5 space-y-3 bg-[var(--color-bg)]">
              <h3 className="text-xs uppercase tracking-[0.14em] font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--color-text-muted)]" />
                Địa chỉ giao hàng
              </h3>
              <div className="text-xs text-[var(--color-text-muted)] space-y-1.5">
                <p className="font-semibold text-sm text-[var(--color-text)]">
                  {addr.full_name}
                </p>
                <p className="font-mono">SĐT: {addr.phone}</p>
                <p className="leading-relaxed">
                  {fullAddress || "Chưa cập nhật địa chỉ"}
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="border border-[var(--color-border)] p-5 space-y-3 bg-[var(--color-bg)]">
              <h3 className="text-xs uppercase tracking-[0.14em] font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--color-text-muted)]" />
                Thanh toán
              </h3>
              <div className="space-y-2.5 text-xs">
                <div>
                  <p className="text-[var(--color-text-muted)]">Phương thức</p>
                  <p className="font-medium text-[var(--color-text)] mt-0.5">
                    {paymentMethodMap[order.payment_method] ||
                      order.payment_method}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)] mb-1">
                    Trạng thái
                  </p>
                  <span className="inline-flex px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-medium border border-[var(--color-border)] bg-[var(--color-surface)]">
                    {payStatusLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* General Status */}
            <div className="border border-[var(--color-border)] p-5 space-y-3 bg-[var(--color-bg)]">
              <h3 className="text-xs uppercase tracking-[0.14em] font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
                Tổng quan đơn
              </h3>
              <div className="space-y-2.5 text-xs">
                <div>
                  <p className="text-[var(--color-text-muted)]">
                    Tổng thanh toán
                  </p>
                  <p className="text-base font-mono font-semibold text-[var(--color-text)] mt-0.5">
                    {formatCurrency(order.total_price)}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)] mb-1">
                    Trạng thái vận chuyển
                  </p>
                  <span className="inline-flex px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-medium border border-[var(--color-border)] bg-[var(--color-surface)]">
                    {ordStatusLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline and products */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Product List */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs uppercase tracking-[0.14em] font-semibold flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[var(--color-text-muted)]" />
                Sản phẩm đã đặt
              </h3>
              <div className="border border-[var(--color-border)] px-5 bg-[var(--color-bg)]">
                {order.items?.map((item) => (
                  <OrderItem key={item._id} item={item} />
                ))}
              </div>
            </div>

            {/* Right: Timeline Stepper */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs uppercase tracking-[0.14em] font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
                Hành trình đơn hàng
              </h3>
              <div className="border border-[var(--color-border)] p-5 bg-[var(--color-bg)]">
                <OrderTimeline order={order} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2.5 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.16em] font-medium hover:opacity-90 transition-opacity"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
