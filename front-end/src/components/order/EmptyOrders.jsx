import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

const EmptyOrders = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-xl border border-gray-100 shadow-sm max-w-2xl mx-auto my-8 animate-fadeIn">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-6 border border-gray-100">
        <ShoppingBag className="w-10 h-10 stroke-1" />
      </div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">
        Bạn chưa có đơn hàng nào
      </h3>
      <p className="text-gray-500 mb-8 max-w-sm text-sm leading-relaxed">
        Hãy khám phá những sản phẩm mới nhất của chúng tôi để bắt đầu mua sắm ngay hôm nay.
      </p>
      <button
        onClick={() => navigate("/products")}
        className="px-8 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors duration-200 shadow-sm hover:shadow-md"
      >
        Tiếp tục mua sắm
      </button>
    </div>
  );
};

export default EmptyOrders;
