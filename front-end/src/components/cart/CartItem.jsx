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
    <div className="flex gap-4 p-4 border border-border rounded-lg bg-card hover:shadow-sm transition-shadow relative text-left">
      {/* Checkbox Selector */}
      <div className="flex items-start">
        <input
          type="checkbox"
          checked={selected}
          disabled={isOutOfStock}
          onChange={() => onToggleSelect(item._id)}
          className="h-5 w-5 rounded border-border bg-background text-accent focus:ring-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Image thumbnail */}
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center">
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

      {/* Product Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold text-foreground truncate ${isOutOfStock ? "line-through text-muted-foreground" : ""}`}>
              {item.name}
            </h4>
            <p className="text-xs text-muted-foreground font-medium">
              {item.category}
            </p>
            
            {/* Variants display */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {item.variants?.[0]?.color && (
                <span className="text-xs bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded">
                  Color: {item.variants[0].color}
                </span>
              )}
              {item.variants?.[0]?.size && (
                <span className="text-xs bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded">
                  Size: {item.variants[0].size}
                </span>
              )}
            </div>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => onRemove(item._id)}
            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition cursor-pointer"
            title="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Price & Quantity Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-foreground">
              {formatPrice(item.new_price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs line-through text-muted-foreground">
                  {formatPrice(item.old_price)}
                </span>
                <span className="text-xs font-bold text-red-500 bg-red-100/20 px-1.5 py-0.5 rounded border border-red-200/50">
                  -{discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Quantity selector */}
          <div className="flex items-center gap-3">
            {isOutOfStock ? (
              <span className="text-xs font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full flex items-center gap-1 border border-destructive/30">
                <AlertTriangle className="h-3 w-3" /> Out of stock
              </span>
            ) : (
              <>
                <div className="flex items-center border border-border rounded overflow-hidden h-8 bg-muted/50">
                  <button
                    onClick={() => onQuantityChange(item._id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-8 h-full hover:bg-muted text-foreground flex items-center justify-center disabled:opacity-50 transition cursor-pointer border-none bg-transparent"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onQuantityChange(item._id, item.quantity + 1)}
                    disabled={item.quantity >= (item.stock ?? 99)}
                    className="w-8 h-full hover:bg-muted text-foreground flex items-center justify-center disabled:opacity-50 transition cursor-pointer border-none bg-transparent"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {isLowStock && (
                  <span className="text-xs font-bold text-yellow-600 bg-yellow-100/20 px-2 py-0.5 rounded-full animate-pulse border border-yellow-200/50">
                    Only {item.stock} left
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
