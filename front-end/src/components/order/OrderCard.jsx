import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import OrderItem from "./OrderItem";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  CreditCard,
  Calendar,
  Hash,
  Eye,
  RotateCcw,
  AlertTriangle,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { paymentApi } from "@/api/payment.api";
import { toast } from "react-toastify";

const paymentMethodMap = {
  cod: "Thanh toán COD",
  momo: "Ví MoMo",
  vnpay: "VNPay",
};

const statusMap = {
  pending: "Chờ xác nhận",
  confirmed: "Chờ lấy hàng",
  shipping: "Đang giao hàng",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const computeRemainingTime = (createdAt) => {
  const difference =
    new Date(createdAt).getTime() + 24 * 60 * 60 * 1000 - Date.now();
  if (difference <= 0) return "Expired";

  const hours = Math.floor(difference / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const OrderCountdown = ({ createdAt }) => {
  const [timeLeft, setTimeLeft] = useState(() =>
    computeRemainingTime(createdAt)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const formatted = computeRemainingTime(createdAt);
      setTimeLeft(formatted);
      if (formatted === "Expired") {
        clearInterval(timer);
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt]);

  if (timeLeft === "Expired" || !timeLeft) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider border border-[var(--color-danger)] text-[var(--color-danger)]">
      Hủy sau: {timeLeft}
    </span>
  );
};

const OrderCard = ({
  order,
  reviewedProductIds,
  onViewDetail,
  onCancel,
  onRebuy,
}) => {
  const [isPaying, setIsPaying] = useState(false);

  const isPendingPayment =
    order.status === "pending" &&
    order.payment_method !== "cod" &&
    (order.payment_status === "pending" || order.payment_status === "failed");

  const statusLabel = isPendingPayment
    ? "Chờ thanh toán"
    : statusMap[order.status] || order.status;

  const canCancel = ["pending", "confirmed"].includes(order.status);
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

  const getProductSlug = (item) => item.product_slug || item.product?.slug;

  const handlePayNow = async () => {
    setIsPaying(true);
    try {
      let payRes;
      const orderId = order._id;
      if (order.payment_method === "momo") {
        payRes = await paymentApi.createMomoPayment(orderId);
      } else if (order.payment_method === "vnpay") {
        payRes = await paymentApi.createVNPayPayment(orderId);
      }

      if (payRes && payRes.success && payRes.paymentUrl) {
        window.location.href = payRes.paymentUrl;
      } else {
        toast.error(
          "Không thể khởi tạo liên kết thanh toán. Vui lòng thử lại."
        );
      }
    } catch (err) {
      console.error("Pay now error:", err);
      toast.error("Gặp lỗi khi kết nối dịch vụ thanh toán.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <article className="border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 bg-[var(--color-bg)] border-b border-[var(--color-border)] gap-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1 text-[var(--color-text)] font-mono font-medium">
            <Hash className="w-3.5 h-3.5" aria-hidden="true" />
            {order._id}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            {formatDate(order.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
            {paymentMethodMap[order.payment_method] || order.payment_method}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isPendingPayment && <OrderCountdown createdAt={order.createdAt} />}
          <span
            className={`inline-flex px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] font-semibold border ${
              isCancelled
                ? "border-[var(--color-danger)] text-[var(--color-danger)]"
                : "border-[var(--color-text)] text-[var(--color-text)]"
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Product List */}
      <div className="px-6 py-2 divide-y divide-[var(--color-border)]">
        {order.items?.map((item) => (
          <div key={item._id}>
            <OrderItem item={item} />
            {isDelivered && (
              <div className="flex flex-wrap justify-end gap-2 pb-3 pt-1">
                {reviewedProductIds?.has(item.product_id?.toString()) ? (
                  <Link
                    to={
                      getProductSlug(item)
                        ? `/product/${getProductSlug(item)}`
                        : "/products"
                    }
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 text-xs uppercase tracking-wider font-medium border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                    Xem đánh giá
                  </Link>
                ) : (
                  <Link
                    to={`/reviews/create?product_id=${item.product_id}&order_id=${order._id}`}
                    state={{ item, order }}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 text-xs uppercase tracking-wider font-medium border border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90 transition-opacity"
                  >
                    <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                    Đánh giá sản phẩm
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => onRebuy(order, item)}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 text-xs uppercase tracking-wider font-medium border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Mua lại
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Card Footer Summary */}
      <div className="px-6 py-4 bg-[var(--color-bg)] border-t border-[var(--color-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            Tổng thanh toán:{" "}
            <strong className="text-base font-mono font-semibold text-[var(--color-text)] ml-1">
              {formatCurrency(order.total_price)}
            </strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onViewDetail(order)}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 bg-[var(--color-surface)] text-[var(--color-text)] text-xs uppercase tracking-[0.14em] font-medium border border-[var(--color-border)] hover:border-[var(--color-text)] transition-colors flex-1 sm:flex-none cursor-pointer"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            Chi tiết
          </button>

          {isPendingPayment && (
            <button
              type="button"
              onClick={handlePayNow}
              disabled={isPaying}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.14em] font-medium hover:opacity-90 disabled:opacity-40 transition-opacity flex-1 sm:flex-none cursor-pointer"
            >
              {isPaying ? (
                <Loader2
                  className="w-4 h-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <CreditCard className="w-4 h-4" aria-hidden="true" />
              )}
              Thanh toán ngay
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(order._id)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 bg-[var(--color-surface)] text-[var(--color-danger)] text-xs uppercase tracking-[0.14em] font-medium border border-[var(--color-danger)] hover:opacity-80 transition-opacity flex-1 sm:flex-none cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              Hủy đơn
            </button>
          )}

          {(isDelivered || isCancelled) && (
            <button
              type="button"
              onClick={() => onRebuy(order)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.14em] font-medium hover:opacity-90 transition-opacity flex-1 sm:flex-none cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Mua lại toàn bộ
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default OrderCard;
