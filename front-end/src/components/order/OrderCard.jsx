import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import OrderItem from "./OrderItem";
import { formatCurrency, formatDate } from "@/utils/format";
import { CreditCard, Calendar, Hash, Eye, RotateCcw, AlertTriangle, MessageSquare, Loader2 } from "lucide-react";
import { paymentApi } from "@/api/payment.api";
import { toast } from "react-toastify";

const paymentMethodMap = {
  cod: "Thanh toán COD",
  momo: "Ví MoMo",
  vnpay: "VNPay",
};

const statusMap = {
  pending: { label: "Chờ xác nhận", colorClass: "text-orange-600 bg-orange-50 border-orange-100" },
  confirmed: { label: "Chờ lấy hàng", colorClass: "text-blue-600 bg-blue-50 border-blue-100" },
  shipping: { label: "Chờ giao hàng", colorClass: "text-purple-600 bg-purple-50 border-purple-100" },
  delivered: { label: "Đã giao", colorClass: "text-green-600 bg-green-50 border-green-100" },
  cancelled: { label: "Đã hủy", colorClass: "text-red-600 bg-red-50 border-red-100" },
};

const OrderCountdown = ({ createdAt }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000 - Date.now();
      if (difference <= 0) {
        return "Expired";
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const formatted = calculateTimeLeft();
      setTimeLeft(formatted);
      if (formatted === "Expired") {
        clearInterval(timer);
        window.location.reload(); // Refresh the page to update status once expired
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt]);

  if (timeLeft === "Expired" || !timeLeft) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
      Hủy sau: {timeLeft}
    </span>
  );
};

const OrderCard = ({ order, reviewedProductIds, onViewDetail, onCancel, onRebuy }) => {
  const [isPaying, setIsPaying] = useState(false);

  const isPendingPayment =
    order.status === "pending" &&
    order.payment_method !== "cod" &&
    (order.payment_status === "pending" || order.payment_status === "failed");

  const statusInfo = isPendingPayment
    ? { label: "Chờ thanh toán", colorClass: "text-rose-600 bg-rose-50 border-rose-100" }
    : statusMap[order.status] || { label: order.status, colorClass: "text-gray-600 bg-gray-50 border-gray-100" };

  const canCancel = ["pending", "confirmed"].includes(order.status);
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

  // Helpers for review link
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
        toast.error("Không thể khởi tạo liên kết thanh toán. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Pay now error:", err);
      toast.error("Gặp lỗi khi kết nối dịch vụ thanh toán.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col animate-fadeIn">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 bg-gray-50/50 border-b border-gray-100 gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-1 text-gray-900 font-medium">
            <Hash className="w-3.5 h-3.5 text-gray-400" />
            {order._id}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {formatDate(order.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-gray-400" />
            {paymentMethodMap[order.payment_method] || order.payment_method}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isPendingPayment && <OrderCountdown createdAt={order.createdAt} />}
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.colorClass}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Product List */}
      <div className="px-6 py-2 divide-y divide-gray-100">
        {order.items?.map((item) => (
          <div key={item._id}>
            <OrderItem item={item} />
            {/* If delivered, show individual review item triggers inside the list */}
            {isDelivered && (
              <div className="flex justify-end gap-2 pb-3 pt-1">
                {reviewedProductIds?.has(item.product_id?.toString()) ? (
                  <Link
                    to={getProductSlug(item) ? `/product/${getProductSlug(item)}` : "#"}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline bg-blue-50/50 px-2.5 py-1 rounded border border-blue-100 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Xem đánh giá
                  </Link>
                ) : (
                  <Link
                    to={`/reviews/create?product_id=${item.product_id}&order_id=${order._id}`}
                    state={{ item, order }}
                    className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium hover:underline bg-orange-50/50 px-2.5 py-1 rounded border border-orange-100 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Đánh giá sản phẩm
                  </Link>
                )}
                <button
                  onClick={() => onRebuy(order, item)}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-black font-medium hover:underline bg-gray-50 px-2.5 py-1 rounded border border-gray-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Mua lại
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Card Footer Summary */}
      <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-sm text-gray-500">
            Tổng cộng: <strong className="text-base font-bold text-gray-950 ml-1">{formatCurrency(order.total_price)}</strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* View Details - always visible */}
          <button
            onClick={() => onViewDetail(order)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-lg border border-gray-200 transition-colors duration-200 shadow-sm flex-1 sm:flex-none"
          >
            <Eye className="w-4 h-4" />
            Xem chi tiết
          </button>

          {/* Pay Now - for unpaid MoMo/VNPay orders */}
          {isPendingPayment && (
            <button
              onClick={handlePayNow}
              disabled={isPaying}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-400 text-white font-medium text-sm rounded-lg border border-transparent transition-colors duration-200 shadow-sm flex-1 sm:flex-none cursor-pointer"
            >
              {isPaying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Thanh toán ngay
            </button>
          )}

          {/* Cancel Order - pending / confirmed */}
          {canCancel && (
            <button
              onClick={() => onCancel(order._id)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 font-medium text-sm rounded-lg border border-red-200 hover:border-red-300 transition-colors duration-200 shadow-sm flex-1 sm:flex-none"
            >
              <AlertTriangle className="w-4 h-4" />
              Hủy đơn hàng
            </button>
          )}

          {/* Rebuy Entire Order - delivered / cancelled */}
          {(isDelivered || isCancelled) && (
            <button
              onClick={() => onRebuy(order)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-900 text-white font-medium text-sm rounded-lg border border-transparent transition-colors duration-200 shadow-sm hover:shadow-md flex-1 sm:flex-none"
            >
              <RotateCcw className="w-4 h-4" />
              Mua lại toàn bộ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
