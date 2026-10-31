import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const PaymentResult = () => {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";
  useDocumentTitle(`Xác nhận đơn hàng — ${siteName}`);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const success = searchParams.get("success") !== "false";

  return (
    <div className="flex min-h-[75vh] items-center justify-center bg-background px-4 py-16 text-foreground">
      <div className="w-full max-w-lg border border-border bg-card p-8 text-center shadow-xs sm:p-12 space-y-6">
        {success ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center border border-foreground bg-secondary text-foreground">
              <CheckCircle2 size={32} strokeWidth={1.5} />
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-center">
                <span className="atelier-seal">
                  {siteName} · ĐƠN HÀNG ĐÃ XÁC NHẬN
                </span>
              </div>
              <h1 className="pt-2 font-serif text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
                Đặt hàng thành công
              </h1>
              <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Cảm ơn bạn đã lựa chọn thiết kế của {siteName}. Đơn hàng của bạn
                đã được ghi nhận vào hệ thống và đang được chuẩn bị đóng gói.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center border border-destructive/50 bg-destructive/10 text-destructive">
              <XCircle size={32} strokeWidth={1.5} />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-destructive">
                Giao dịch chưa hoàn tất
              </p>
              <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
                Thanh toán thất bại
              </h1>
              <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Giao dịch đã bị gián đoạn hoặc từ chối bởi cổng thanh toán. Bạn
                có thể kiểm tra danh sách đơn hàng để tiến hành thanh toán lại.
              </p>
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="touch-target flex w-full items-center justify-center gap-2 bg-primary px-6 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground transition-opacity hover:opacity-90"
          >
            <ShoppingBag size={15} />
            <span>Theo dõi đơn hàng</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/products")}
            className="touch-target flex w-full items-center justify-center gap-2 border border-border bg-background px-6 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-foreground transition-colors hover:border-foreground hover:bg-secondary"
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
