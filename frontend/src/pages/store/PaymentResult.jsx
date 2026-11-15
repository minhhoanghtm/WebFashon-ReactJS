import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight, Package, Home } from "lucide-react";
import { Button } from "../../components/ui/Button";

export function PaymentResult() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId") || "ORD-" + Math.floor(100000 + Math.random() * 900000);
  const status = params.get("status") || "success";
  const isSuccess = status === "success";

  return (
    <div className="max-w-[720px] mx-auto px-4 py-16 sm:py-24 text-center">
      <div className="bg-[#121215] border border-[rgba(244,240,232,0.15)] p-8 sm:p-12 shadow-2xl space-y-6 animate-fade-in">
        {isSuccess ? (
          <div className="w-16 h-16 mx-auto bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>
        ) : (
          <div className="w-16 h-16 mx-auto bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center">
            <XCircle size={36} />
          </div>
        )}

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#e65100]">
            THÔNG BÁO GIAO DỊCH
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#f4f0e8]">
            {isSuccess ? "Đặt Hàng Thành Công!" : "Giao Dịch Bị Hủy Hoặc Thất Bại"}
          </h1>
          <p className="text-xs sm:text-sm text-[#9a989f] max-w-md mx-auto leading-relaxed">
            {isSuccess
              ? "Cảm ơn bạn đã lựa chọn Atelier. Đội ngũ nghệ nhân của chúng tôi sẽ bắt đầu chuẩn bị đóng gói trang phục và liên hệ giao hàng."
              : "Thanh toán chưa hoàn tất. Bạn có thể thử lại bằng phương thức khác hoặc chọn hình thức COD."}
          </p>
        </div>

        {/* Order Info Card */}
        <div className="p-4 bg-[#161619] border border-[rgba(244,240,232,0.1)] text-left text-xs font-mono space-y-2 max-w-sm mx-auto">
          <div className="flex justify-between text-[#9a989f]">
            <span>Mã Đơn Hàng:</span>
            <span className="text-[#f4f0e8] font-bold">{orderId}</span>
          </div>
          <div className="flex justify-between text-[#9a989f]">
            <span>Thời Gian:</span>
            <span className="text-[#f4f0e8]">{new Date().toLocaleString("vi-VN")}</span>
          </div>
          <div className="flex justify-between text-[#9a989f]">
            <span>Trạng Thái:</span>
            <span className={isSuccess ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
              {isSuccess ? "ĐÃ TIẾP NHẬN" : "CHƯA THANH TOÁN"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link to="/">
            <Button variant="secondary" size="md" className="gap-2">
              <Home size={16} />
              <span>Về Trang Chủ</span>
            </Button>
          </Link>
          <Link to={`/order-lookup?orderCode=${orderId}`}>
            <Button variant="signal" size="md" className="gap-2">
              <Package size={16} />
              <span>Theo Dõi Tiến Độ Đơn</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function OrderLookup() {
  const [params] = useSearchParams();
  const [orderCode, setOrderCode] = useState(params.get("orderCode") || "");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLookup = (e) => {
    e.preventDefault();
    setHasSearched(true);
    setResult({
      orderCode: orderCode || "ORD-998241",
      customer: "Nguyễn Văn A",
      status: "Đang vận chuyển",
      shippingPartner: "GHN Express",
      trackingCode: "GHN-VN-882194",
      createdAt: "15/11/2026 14:30",
      totalAmount: 1850000,
      steps: [
        { label: "Đã tiếp nhận đơn", time: "15/11 14:30", completed: true },
        { label: "Hoàn tất đóng gói", time: "15/11 18:00", completed: true },
        { label: "Đang giao hàng", time: "16/11 08:30", completed: true },
        { label: "Giao hàng thành công", time: "Dự kiến 17/11", completed: false },
      ],
    });
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 py-12 sm:py-16 w-full space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-mono uppercase tracking-widest text-[#e65100]">
          HỖ TRỢ KHÁCH HÀNG
        </span>
        <h1 className="font-display text-3xl font-bold uppercase text-[#f4f0e8]">
          Tra Cứu Tiến Độ Đơn Hàng
        </h1>
        <p className="text-xs text-[#9a989f]">
          Nhập mã đơn hàng và số điện thoại mua hàng để kiểm tra lộ trình giao hàng trực tiếp.
        </p>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleLookup} className="bg-[#121215] border border-[rgba(244,240,232,0.12)] p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-[#9a989f] font-medium block mb-1">
              Mã Đơn Hàng (Ví dụ: ORD-123456)
            </label>
            <input
              type="text"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder="ORD-..."
              className="w-full min-h-[44px] px-3.5 bg-[#161619] border border-[rgba(244,240,232,0.15)] text-sm font-mono text-[#f4f0e8]"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-[#9a989f] font-medium block mb-1">
              Số Điện Thoại Đặt Hàng
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09..."
              className="w-full min-h-[44px] px-3.5 bg-[#161619] border border-[rgba(244,240,232,0.15)] text-sm font-mono text-[#f4f0e8]"
            />
          </div>
        </div>
        <Button type="submit" variant="signal" size="md" className="w-full">
          Kiểm Tra Tiến Độ
        </Button>
      </form>

      {/* Result Card */}
      {hasSearched && result && (
        <div className="bg-[#121215] border border-[rgba(244,240,232,0.15)] p-6 space-y-6 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-xs font-mono text-[#9a989f]">MÃ ĐƠN:</span>
              <h3 className="font-display text-lg text-[#f4f0e8]">{result.orderCode}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-[#9a989f]">TRẠNG THÁI:</span>
              <span className="block text-xs font-mono font-bold text-amber-400 uppercase">
                {result.status}
              </span>
            </div>
          </div>

          {/* Timeline steps */}
          <div className="space-y-4">
            <span className="text-xs font-mono uppercase text-[#9a989f] block">
              Lộ Trình Vận Chuyển:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {result.steps.map((st, i) => (
                <div
                  key={i}
                  className={`p-3 border text-xs ${
                    st.completed
                      ? "border-emerald-700/60 bg-emerald-950/20 text-emerald-300"
                      : "border-white/10 bg-[#161619] text-[#6b6973]"
                  }`}
                >
                  <div className="font-semibold">{st.label}</div>
                  <div className="text-[10px] font-mono mt-1">{st.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
