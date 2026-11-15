import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, ShoppingBag, ArrowRight, Search } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useAuthStore } from "@/store/auth.store";

const PaymentResult = () => {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";
  useDocumentTitle(`Xác nhận đơn hàng — ${siteName}`);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const success = searchParams.get("success") !== "false";
  const orderCode =
    searchParams.get("orderCode") ||
    searchParams.get("code") ||
    searchParams.get("orderId") ||
    "";
  const isGuest = searchParams.get("guest") === "true" || !isAuthenticated;

  return (
    <div className="flex min-h-[75vh] items-center justify-center bg-background px-4 py-16 text-foreground">
      <div className="w-full max-w-lg border border-border bg-card p-8 text-center shadow-xs sm:p-12 space-y-6 rounded-2xl">
        {success ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center border border-foreground bg-secondary text-foreground rounded-full">
              <CheckCircle2 size={32} strokeWidth={1.5} />
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-center">
                <span className="atelier-seal">
                  {siteName} · ĐƠN HÀNG ĐÃ XÁC NHẬN
                </span>
              </div>
              <h1 className="pt-2 font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl leading-tight">
                Đặt hàng thành công
              </h1>
              <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Cảm ơn bạn đã lựa chọn thiết kế của {siteName}. Đơn hàng của bạn đã được ghi nhận và đang chuẩn bị đóng gói.
              </p>
            </div>

            {orderCode && (
              <div className="p-4 bg-muted/40 border border-border rounded-xl text-center space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
                  Mã đơn hàng
                </span>
                <span className="font-mono text-lg font-bold text-foreground">
                  #{orderCode.length >= 8 ? orderCode.slice(-8).toUpperCase() : orderCode.toUpperCase()}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Lưu lại mã này kèm số điện thoại để tra cứu tiến độ vận chuyển bất cứ lúc nào.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center border border-destructive/50 bg-destructive/10 text-destructive rounded-full">
              <XCircle size={32} strokeWidth={1.5} />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-destructive">
                Giao dịch chưa hoàn tất
              </p>
              <h1 className="font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl leading-tight">
                Thanh toán thất bại
              </h1>
              <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Giao dịch đã bị gián đoạn hoặc từ chối bởi cổng thanh toán. Bạn có thể kiểm tra danh sách đơn hàng để tiến hành thanh toán lại.
              </p>
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 border-t border-border pt-6">
          {isGuest ? (
            <button
              type="button"
              data-testid="track-guest-order-btn"
              onClick={() =>
                navigate(
                  orderCode
                    ? `/order-lookup?code=${encodeURIComponent(orderCode)}`
                    : "/order-lookup"
                )
              }
              className="touch-target flex w-full items-center justify-center gap-2 bg-primary px-6 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground transition-opacity hover:opacity-90 rounded-xl"
            >
              <Search size={15} />
              <span>Tra cứu đơn hàng</span>
            </button>
          ) : (
            <button
              type="button"
              data-testid="track-order-btn"
              onClick={() => navigate("/orders")}
              className="touch-target flex w-full items-center justify-center gap-2 bg-primary px-6 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground transition-opacity hover:opacity-90 rounded-xl"
            >
              <ShoppingBag size={15} />
              <span>Theo dõi đơn hàng</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate("/products")}
            className="touch-target flex w-full items-center justify-center gap-2 border border-border bg-background px-6 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-foreground transition-colors hover:border-foreground hover:bg-secondary rounded-xl"
          >
            <span>Tiếp tục khám phá Bộ sưu tập</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
