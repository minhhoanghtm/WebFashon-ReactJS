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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-[#F7F7F7] select-none">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#05251C]/10 p-8 sm:p-10 shadow-xl text-center space-y-6">
        {success ? (
          <>
            <div className="mx-auto w-16 h-16 bg-[#073D2A]/10 rounded-2xl flex items-center justify-center text-[#073D2A] border border-[#073D2A]/20">
              <CheckCircle2 size={36} className="stroke-[2.2]" />
            </div>
            <div className="space-y-2">
              <span className="micro-label text-[#073D2A]">
                GIAO DỊCH HOÀN TẤT
              </span>
              <h2 className="text-3xl font-display font-black text-[#05251C] uppercase tracking-tight">
                ĐẶT HÀNG THÀNH CÔNG
              </h2>
              <p className="text-xs sm:text-sm text-[#6B716E] leading-relaxed">
                Cảm ơn bạn đã tin tưởng lựa chọn thiết kế của 404Studio. Đơn hàng đã được tiếp nhận và chuẩn bị may đo đóng gói.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-200">
              <XCircle size={36} className="stroke-[2.2]" />
            </div>
            <div className="space-y-2">
              <span className="micro-label text-rose-700">
                GIAO DỊCH CHƯA HOÀN TẤT
              </span>
              <h2 className="text-3xl font-display font-black text-[#05251C] uppercase tracking-tight">
                THANH TOÁN THẤT BẠI
              </h2>
              <p className="text-xs sm:text-sm text-[#6B716E] leading-relaxed">
                Giao dịch đã bị gián đoạn hoặc từ chối bởi cổng thanh toán. Bạn có thể kiểm tra danh sách đơn hàng để tiến hành thanh toán lại.
              </p>
            </div>
          </>
        )}

        <div className="pt-2 flex flex-col gap-3">
          <button
            onClick={() => navigate("/orders")}
            className="w-full flex items-center justify-center gap-2 bg-[#05251C] hover:bg-[#F5DD20] hover:text-[#05251C] text-white font-display font-bold py-3.5 px-6 rounded-full text-xs uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer active:scale-95"
          >
            <ShoppingBag size={15} />
            <span>Xem đơn hàng của bạn</span>
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 border border-[#05251C]/20 hover:bg-neutral-50 text-[#05251C] font-display font-bold py-3.5 px-6 rounded-full text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95"
          >
            <span>Tiếp tục khám phá Atelier</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
