import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

const EmptyOrders = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-[#E8E5DF] shadow-2xs max-w-2xl mx-auto my-8">
      <div className="w-20 h-20 bg-[#05251C]/5 rounded-2xl flex items-center justify-center text-[#05251C] mb-6 border border-[#05251C]/15 shadow-2xs">
        <ShoppingBag className="w-10 h-10" />
      </div>
      <h3 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight text-[#05251C] mb-2">
        Bạn chưa có đơn hàng nào
      </h3>
      <p className="text-[#6B716E] mb-8 max-w-sm text-sm leading-relaxed">
        Hãy khám phá những sản phẩm mới nhất của chúng tôi để bắt đầu mua sắm ngay hôm nay.
      </p>
      <button
        onClick={() => navigate("/products")}
        className="px-8 py-3.5 bg-[#05251C] hover:bg-[#073D2A] text-[#F5DD20] text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-200 shadow-md active:scale-95 cursor-pointer"
      >
        Tiếp tục mua sắm
      </button>
    </div>
  );
};

export default EmptyOrders;
