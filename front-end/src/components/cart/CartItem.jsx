import React from "react";
import { Trash2, Plus, Minus, AlertTriangle, Zap } from "lucide-react";

const CartItem = ({
  item,
  selected,
  onToggleSelect,
  onQuantityChange,
  onRemove,
}) => {
  const hasDiscount = item.old_price > item.new_price;
  const discountPercent = hasDiscount
    ? Math.round(((item.old_price - item.new_price) / item.old_price) * 100)
    : 0;

  const formatPrice = (val) => {
    return (val || 0).toLocaleString("vi-VN") + " đ";
  };

  const isLowStock = item.stock !== undefined && item.stock > 0 && item.stock <= 5;
  const isOutOfStock = item.stock !== undefined && item.stock <= 0;

  return (
    <div className="flex gap-3 sm:gap-4 p-4 border border-neutral-200/80 rounded-2xl bg-white hover:shadow-xs transition-shadow relative text-left">
      {/* Checkbox Selector */}
      <div className="flex items-center pt-1 sm:pt-0">
        <input
          type="checkbox"
          checked={selected}
          disabled={isOutOfStock}
          onChange={() => onToggleSelect(item._id)}
          className="h-4.5 w-4.5 rounded border-neutral-300 text-neutral-900 focus:ring-0 accent-[#05251C] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        />
      </div>

      {/* Image thumbnail */}
      <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl border border-neutral-200/60 bg-neutral-100 flex items-center justify-center">
        <img
          src={item.image || item.productImage || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&auto=format&fit=crop&q=60"}
          alt={item.name}
          className={`h-full w-full object-cover object-center transition-all ${isOutOfStock ? "grayscale opacity-50" : ""}`}
          onError={(e) => {
            if (item.productImage && e.target.src !== item.productImage) {
              e.target.src = item.productImage;
            } else {
              e.target.src = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&auto=format&fit=crop&q=60";
            }
          }}
        />
      </div>

      {/* Product Details info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h4 className={`text-xs sm:text-sm font-bold text-neutral-900 truncate ${isOutOfStock ? "line-through text-neutral-400" : ""}`}>
              {item.name}
            </h4>
            <p className="text-[11px] text-neutral-400 font-medium">
              {item.category || "Thời trang"}
            </p>
            
            {/* Campaign info & Price change warning */}
            {item.campaign && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-200/60 px-2 py-0.5 rounded-md">
                  <Zap size={10} fill="currentColor" /> {item.campaign.name}
                </span>
                {item.campaign.isQuotaExhausted && (
                  <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded font-medium">
                    (Hết suất ưu đãi)
                  </span>
                )}
              </div>
            )}
            {item.price_changed && (
              <div className="mt-1">
                <span className="inline-block text-[10px] text-[#05251C] bg-[#F5DD20]/20 border border-[#F5DD20]/40 px-1.5 py-0.5 rounded font-bold">
                  Giá đã được cập nhật lại theo thời gian thực
                </span>
              </div>
            )}

            {/* Color & Size display */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {item.variants?.[0]?.color && (
                <span className="inline-block text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md">
                  Màu: {item.variants[0].color}
                </span>
              )}
              {item.variants?.[0]?.size && (
                <span className="inline-block text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md">
                  Size: {item.variants[0].size}
                </span>
              )}
            </div>
          </div>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onRemove(item._id)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
            title="Xóa sản phẩm"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Price & Quantity adjusting controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          {/* Price details */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-extrabold text-neutral-950 tabular-nums">
              {formatPrice(item.new_price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs line-through text-neutral-400 tabular-nums">
                  {formatPrice(item.old_price)}
                </span>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200/60 px-1.5 py-0.2 rounded">
                  -{discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Quantity selector */}
          <div className="flex items-center gap-2">
            {isOutOfStock ? (
              <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Hết hàng
              </span>
            ) : (
              <>
                {/* Quantity select inputs */}
                <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden h-7 sm:h-8 bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => onQuantityChange(item._id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-7 sm:w-8 h-full bg-neutral-50 hover:bg-neutral-100 text-neutral-600 flex items-center justify-center disabled:opacity-30 transition cursor-pointer border-none"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 sm:w-9 text-center text-xs font-bold text-neutral-900 tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onQuantityChange(item._id, item.quantity + 1)}
                    disabled={item.quantity >= (item.stock ?? 99)}
                    className="w-7 sm:w-8 h-full bg-neutral-50 hover:bg-neutral-100 text-neutral-600 flex items-center justify-center disabled:opacity-30 transition cursor-pointer border-none"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Stock warnings */}
                {isLowStock && (
                  <span className="text-[10px] font-bold text-[#05251C] bg-[#F5DD20]/25 border border-[#F5DD20]/50 px-2 py-0.5 rounded-md">
                    Còn {item.stock}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
