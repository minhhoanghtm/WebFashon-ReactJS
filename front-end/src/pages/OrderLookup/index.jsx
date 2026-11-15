import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
  Phone,
  MapPin,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { formatCurrency } from "@/utils/format";
import axiosClient from "@/api/axiosClient";
import { orderApi } from "@/api/order.api";
import { getGuestOrderToken, saveGuestOrderToken } from "@/utils/guestOrderAccess";

const statusConfig = {
  pending: {
    label: "Chờ xác nhận",
    icon: Clock,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  confirmed: {
    label: "Đã xác nhận",
    icon: Package,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  shipping: {
    label: "Đang giao hàng",
    icon: Truck,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  delivered: {
    label: "Giao thành công",
    icon: CheckCircle,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  cancelled: {
    label: "Đã hủy",
    icon: XCircle,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

export const OrderLookup = () => {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "Web Fashion";
  useDocumentTitle(`Tra cứu đơn hàng — ${siteName}`);

  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || searchParams.get("orderCode") || searchParams.get("orderId") || "";
  const initialPhone = searchParams.get("phone") || "";

  const [orderCode, setOrderCode] = useState(initialCode);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [guestToken, setGuestToken] = useState("");
  const [actionError, setActionError] = useState("");

  const handleLookup = useCallback(async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setErrorMsg("");
    setOrder(null);

    const cleanCode = orderCode.trim();
    const cleanPhone = phone.trim().replace(/[\s\-.]/g, "");

    if (!cleanCode || !cleanPhone) {
      setErrorMsg("Vui lòng nhập cả Mã đơn hàng và Số điện thoại đặt hàng.");
      return;
    }

    setLoading(true);

    try {
      const res = await axiosClient.get("/order/guest-lookup", {
        params: {
          orderCode: cleanCode,
          phone: cleanPhone,
        },
      });

      if (res?.success && res?.order) {
        setOrder(res.order);
        setGuestToken(getGuestOrderToken(res.order._id) || "");
      } else {
        setErrorMsg("Không tìm thấy đơn hàng với thông tin đã nhập.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Không tìm thấy đơn hàng hoặc số điện thoại không khớp. Vui lòng kiểm tra lại.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [orderCode, phone]);

  const contact = settings?.contact || settings?.general || {};
  const contactHint = [contact.hotline || contact.phone, contact.email].filter(Boolean).join(" · ") || "vui lòng liên hệ cửa hàng";
  const saveToken = () => {
    if (!order?._id || !guestToken.trim()) return;
    saveGuestOrderToken(order._id, guestToken.trim());
    setActionError("");
  };
  const cancelGuestOrder = async () => {
    if (!order?._id || !guestToken.trim()) return;
    try {
      await orderApi.deleteGuestOrder(order._id, guestToken.trim());
      setOrder((current) => ({ ...current, status: "cancelled" }));
    } catch (error) {
      const status = error?.response?.status;
      setActionError(status === 401 || status === 403 ? "Mã truy cập không đúng hoặc đã hết hiệu lực. Mã vẫn được giữ trên thiết bị." : "Không thể hủy đơn lúc này. Vui lòng thử lại hoặc liên hệ hỗ trợ.");
    }
  };

  useEffect(() => {
    if (initialCode && initialPhone) {
      handleLookup();
    }
  }, [initialCode, initialPhone, handleLookup]);

  const statusMeta = order ? statusConfig[order.status] || statusConfig.pending : null;
  const StatusIcon = statusMeta ? statusMeta.icon : Clock;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 md:py-16">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-[11px] font-medium tracking-[0.28em] uppercase text-muted-foreground">
          {siteName} · TRA CỨU ĐƠN HÀNG
        </span>
        <h1 className="mt-2 text-2xl md:text-3xl font-serif text-foreground font-medium">
          Kiểm Tra Tiến Độ Đơn Hàng
        </h1>
        <p className="mt-2 text-xs md:text-sm text-muted-foreground">
          Dành cho khách mua hàng vãng lai không có tài khoản hoặc muốn tra cứu nhanh thông qua mã đơn và số điện thoại.
        </p>
      </div>

      {/* Search Box */}
      <form
        onSubmit={handleLookup}
        className="max-w-2xl mx-auto bg-card border border-border p-6 md:p-8 rounded-2xl shadow-sm space-y-4 mb-10"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
              Mã đơn hàng <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              data-testid="lookup-order-code"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder="VD: 68E12A hoặc mã đầy đủ"
              className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground min-h-[44px]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
              Số điện thoại đặt hàng <span className="text-destructive">*</span>
            </label>
            <input
              type="tel"
              data-testid="lookup-order-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0912345678"
              className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground min-h-[44px]"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          data-testid="lookup-submit-btn"
          disabled={loading}
          className="w-full mt-2 flex items-center justify-center gap-2 bg-foreground text-background hover:opacity-90 font-medium text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all disabled:opacity-50 min-h-[44px] cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>{loading ? "Đang tra cứu..." : "Tra cứu đơn hàng"}</span>
        </button>

        {errorMsg && (
          <div
            data-testid="lookup-error"
            className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </form>

      {/* Result Card */}
      {order && (
        <div
          data-testid="lookup-result-card"
          className="max-w-2xl mx-auto bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
        >
          {/* Card Top Banner */}
          <div className="p-6 border-b border-border flex flex-wrap items-center justify-between gap-4 bg-muted/20">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider block">
                Mã đơn hàng
              </span>
              <span className="text-lg font-mono font-bold text-foreground">
                #{order.order_code || order._id.slice(-8).toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                Ngày đặt: {new Date(order.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${statusMeta.color}`}>
              <StatusIcon className="w-4 h-4" />
              <span>{statusMeta.label}</span>
            </div>
          </div>

          {/* Delivery & Payment Information */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-border text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                <span>Thông tin giao hàng</span>
              </div>
              <p className="font-medium text-foreground text-sm">
                {order.shipping_address?.full_name}
              </p>
              <p className="text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {order.shipping_address?.phone}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {order.shipping_address?.address_detail && `${order.shipping_address.address_detail}, `}
                {order.shipping_address?.ward && `${order.shipping_address.ward}, `}
                {order.shipping_address?.district && `${order.shipping_address.district}, `}
                {order.shipping_address?.city}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider font-semibold">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Phương thức thanh toán</span>
              </div>
              <p className="font-medium text-foreground uppercase">
                {order.payment_method === "cod" ? "Thanh toán khi nhận hàng (COD)" : order.payment_method.toUpperCase()}
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-muted text-foreground">
                <span className={`w-2 h-2 rounded-full ${order.payment_status === "paid" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                <span>{order.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</span>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="p-6 divide-y divide-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
              Chi tiết sản phẩm ({order.items?.length || 0})
            </span>
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-14 bg-muted border border-border rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {item.product_name}
                    </p>
                    <span className="text-[11px] text-muted-foreground">
                      Số lượng: {item.quantity} × {formatCurrency(item.price)}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                  {formatCurrency((item.price || 0) * (item.quantity || 1))}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="p-6 bg-muted/20 border-t border-border space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Tạm tính</span>
              <span>{formatCurrency(order.original_price || order.total_price)}</span>
            </div>
            {Boolean(order.discount_amount) && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Giảm giá</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Phí vận chuyển</span>
              <span>{order.original_price >= 1000000 ? "Miễn phí" : formatCurrency(30000)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-foreground pt-2 border-t border-border">
              <span>Tổng thanh toán</span>
              <span className="text-base text-foreground font-mono">
                {formatCurrency(order.total_price)}
              </span>
            </div>
          </div>
          {order.is_guest && order.status === "pending" && (
            <div className="p-6 border-t border-border space-y-3">
              <label className="text-xs font-medium">Mã truy cập đơn guest</label>
              <div className="flex gap-2">
                <input data-testid="guest-token-input" value={guestToken} onChange={(e) => setGuestToken(e.target.value)} placeholder="Nhập mã đã lưu" className="flex-1 px-3 py-2 border border-border rounded" />
                <button type="button" onClick={saveToken} className="px-3 py-2 border border-border rounded">Lưu mã</button>
              </div>
              {!guestToken && <p data-testid="guest-token-help" className="text-xs text-muted-foreground">Không có mã hoặc đổi thiết bị? {contactHint}</p>}
              {guestToken && <button data-testid="guest-cancel-btn" type="button" onClick={cancelGuestOrder} className="px-3 py-2 text-xs border border-destructive text-destructive rounded">Hủy đơn hàng</button>}
              {actionError && <p data-testid="guest-action-error" className="text-xs text-destructive">{actionError}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderLookup;
