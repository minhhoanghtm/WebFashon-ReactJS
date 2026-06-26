import React from "react";
import { Trash2, Plus, Minus, AlertTriangle } from "lucide-react";

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
    return val.toLocaleString("vi-VN") + "đ";
  };

  const isLowStock = item.stock !== undefined && item.stock > 0 && item.stock <= 5;
  const isOutOfStock = item.stock !== undefined && item.stock <= 0;

  return (
    <div className="flex gap-4 p-4 md:p-5 border border-slate-100 dark:border-slate-800/60 rounded-2xl bg-white dark:bg-slate-900/20 hover:shadow-md transition-shadow relative text-left">
      {/* Checkbox Selector */}
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={selected}
          disabled={isOutOfStock}
          onChange={() => onToggleSelect(item._id)}
          className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        />
      </div>

      {/* Image thumbnail */}
      <div className="h-24 w-24 md:h-28 md:w-28 shrink-0 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <img
          src={item.image || item.productImage || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&auto=format&fit=crop&q=60"}
          alt={item.name}
          className={`h-full w-full object-contain object-center transition-all ${isOutOfStock ? "grayscale opacity-50" : ""}`}
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
      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h4 className={`text-sm md:text-base font-bold text-slate-900 dark:text-white truncate ${isOutOfStock ? "line-through text-slate-400" : ""}`}>
              {item.name}
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {item.category}
            </p>
            
            {/* Color & Size display */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {item.variants?.[0]?.color && (
                <span className="inline-block text-[11px] bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800 px-2 py-0.5 rounded">
                  Màu: {item.variants[0].color}
                </span>
              )}
              {item.variants?.[0]?.size && (
                <span className="inline-block text-[11px] bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800 px-2 py-0.5 rounded">
                  Size: {item.variants[0].size}
                </span>
              )}
            </div>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => onRemove(item._id)}
            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Xóa sản phẩm"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Price & Quantity adjusting controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Price details */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm md:text-base font-extrabold text-slate-950 dark:text-white">
              {formatPrice(item.new_price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs line-through text-slate-400 dark:text-slate-600">
                  {formatPrice(item.old_price)}
                </span>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 px-1.5 py-0.2 rounded">
                  -{discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Quantity selector */}
          <div className="flex items-center gap-3">
            {isOutOfStock ? (
              <span className="text-xs font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Hết hàng
              </span>
            ) : (
              <>
                {/* Quantity select inputs */}
                <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden h-8">
                  <button
                    onClick={() => onQuantityChange(item._id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-8 h-full bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-slate-50 transition cursor-pointer border-none"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onQuantityChange(item._id, item.quantity + 1)}
                    disabled={item.quantity >= (item.stock ?? 99)}
                    className="w-8 h-full bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-slate-50 transition cursor-pointer border-none"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Stock warnings */}
                {isLowStock && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30 px-2 py-0.5 rounded-full animate-pulse">
                    Chỉ còn {item.stock} sản phẩm
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
