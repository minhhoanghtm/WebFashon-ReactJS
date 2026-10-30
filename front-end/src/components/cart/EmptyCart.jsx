import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";

const EmptyCart = () => {
  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center flex flex-col items-center bg-white rounded-2xl border border-neutral-200/80 shadow-xs my-8">
      {/* Icon Container */}
      <div className="w-20 h-20 rounded-2xl bg-[#05251C]/5 border border-[#05251C]/15 flex items-center justify-center text-[#05251C] mb-5 shadow-2xs">
        <ShoppingBag className="w-10 h-10" />
      </div>

      {/* Details */}
      <div className="space-y-2 mb-6">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#05251C] font-display uppercase">
          Giỏ hàng của bạn đang trống
        </h2>
        <p className="text-sm text-neutral-500 max-w-sm leading-relaxed mx-auto">
          Bạn chưa chọn sản phẩm nào. Hãy khám phá những thiết kế mới nhất và bổ sung vào phong cách của bạn.
        </p>
      </div>

      {/* Shop Link */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 rounded-full bg-[#05251C] hover:bg-[#073D2A] text-[#F5DD20] px-7 py-3.5 text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
      >
        <span>Khám phá bộ sưu tập</span>
        <ArrowRight size={14} />
      </Link>
    </div>
  );
};

export default EmptyCart;
