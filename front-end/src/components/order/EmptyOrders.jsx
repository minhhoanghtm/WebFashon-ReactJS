import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

const EmptyOrders = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[var(--color-surface)] border border-[var(--color-border)] max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] mb-6">
        <ShoppingBag className="w-7 h-7 stroke-[1.5]" aria-hidden="true" />
      </div>
      <h3 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-2">
        Bạn chưa có đơn hàng nào
      </h3>
      <p className="text-[var(--color-text-muted)] mb-8 max-w-sm text-xs leading-relaxed">
        Hãy khám phá bộ sưu tập thiết kế đơn sắc mới nhất để bắt đầu hành trình
        mua sắm của bạn.
      </p>
      <button
        type="button"
        onClick={() => navigate("/products")}
        className="min-h-[48px] px-8 py-3 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.16em] font-medium hover:opacity-90 transition-opacity cursor-pointer"
      >
        Tiếp tục mua sắm
      </button>
    </div>
  );
};

export default EmptyOrders;
