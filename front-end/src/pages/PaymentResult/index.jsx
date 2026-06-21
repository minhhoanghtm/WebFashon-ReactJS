import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const PaymentResult = () => {
  useDocumentTitle("Kết quả thanh toán");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const success = searchParams.get("success") === "true";

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-gray-50 dark:bg-slate-900/50">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-8 shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
        {success ? (
          <>
            <div className="mx-auto w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={40} className="stroke-[2.5]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Thanh toán thành công!
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                Cảm ơn bạn đã tin tưởng mua sắm tại 404Studio. Đơn hàng của bạn đã được ghi nhận thanh toán và đang được xử lý.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center text-rose-500">
              <XCircle size={40} className="stroke-[2.5]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Thanh toán thất bại!
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                Đã xảy ra lỗi trong quá trình xử lý giao dịch hoặc giao dịch đã bị hủy. Bạn có thể kiểm tra lại đơn hàng và thanh toán lại bất cứ lúc nào.
              </p>
            </div>
          </>
        )}

        <div className="pt-4 flex flex-col gap-3">
          <button
            onClick={() => navigate("/orders")}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-sm"
          >
            <ShoppingBag size={18} />
            Quản lý đơn hàng
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-850 dark:text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
          >
            Tiếp tục mua sắm
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
