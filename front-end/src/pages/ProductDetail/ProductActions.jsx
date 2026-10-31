import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ShoppingBag, Zap, Heart, LoaderCircle } from "lucide-react";
import trackingService from "@/services/tracking.service";
import { addCartItemService } from "@/services/cartItem.service";
import { useAuthStore } from "@/store/auth.store";
import { useFavoriteStore } from "@/store/favorite.store";
import { formatCurrency } from "@/utils/format";
import { getColorHex } from "../ProductSearch/productAdapter";

const uniqueValues = (values) => [...new Set(values.filter(Boolean))];

const ProductActions = ({ product, variants = [], onVariantChange }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleFavorite = useFavoriteStore((state) => state.toggleProduct);

  const role = user?.role || user?.data?.role || "";
  const isAdmin = role === "admin";

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const productId = String(product?.id || product?._id || "");
  const isFavorite = favoriteItems.some(
    (item) => String(item.id || item._id) === productId
  );

  const safeVariants = useMemo(() => {
    if (
      product &&
      Array.isArray(product.variants) &&
      product.variants.length > 0
    ) {
      return product.variants;
    }
    return Array.isArray(variants) ? variants : [];
  }, [product, variants]);

  const colorOptions = useMemo(() => {
    if (safeVariants.length > 0) {
      return uniqueValues(safeVariants.map((variant) => variant.color));
    }
    return Array.isArray(product?.colors) ? product.colors : [];
  }, [safeVariants, product?.colors]);

  const sizeOptions = useMemo(() => {
    if (safeVariants.length > 0) {
      const variantsByColor = selectedColor
        ? safeVariants.filter((variant) => variant.color === selectedColor)
        : safeVariants;

      return uniqueValues(variantsByColor.map((variant) => variant.size));
    }
    return Array.isArray(product?.sizes) ? product.sizes : [];
  }, [safeVariants, selectedColor, product?.sizes]);

  const isColorDisabled = (color) => {
    if (safeVariants.length === 0) return false;
    const variantsForColor = safeVariants.filter((v) => v.color === color);
    return variantsForColor.every(
      (v) =>
        v.stock !== undefined && v.stock !== null && Number(v.stock) <= 0
    );
  };

  const isSizeDisabled = (size) => {
    if (safeVariants.length === 0) return false;
    if (selectedColor) {
      const variant = safeVariants.find(
        (v) => v.color === selectedColor && v.size === size
      );
      return variant
        ? variant.stock !== undefined &&
            variant.stock !== null &&
            Number(variant.stock) <= 0
        : true;
    }
    const variantsForSize = safeVariants.filter((v) => v.size === size);
    return variantsForSize.every(
      (v) =>
        v.stock !== undefined && v.stock !== null && Number(v.stock) <= 0
    );
  };

  const isAllOutOfStock = useMemo(() => {
    if (safeVariants.length > 0) {
      return safeVariants.every(
        (v) =>
          v.stock !== undefined && v.stock !== null && Number(v.stock) <= 0
      );
    }
    return (
      product?.isSoldOut ||
      (product?.stock !== null &&
        product?.stock !== undefined &&
        product.stock <= 0)
    );
  }, [safeVariants, product]);

  const selectedVariant = useMemo(() => {
    if (!safeVariants.length) return null;
    return (
      safeVariants.find((variant) => {
        const matchesColor = colorOptions.length
          ? variant.color === selectedColor
          : true;
        const matchesSize = sizeOptions.length
          ? variant.size === selectedSize
          : true;
        return matchesColor && matchesSize;
      }) || null
    );
  }, [
    colorOptions.length,
    safeVariants,
    selectedColor,
    selectedSize,
    sizeOptions.length,
  ]);

  useEffect(() => {
    if (onVariantChange) {
      onVariantChange(selectedVariant);
    }
  }, [selectedVariant, onVariantChange]);

  const variantStock =
    selectedVariant &&
    selectedVariant.stock !== undefined &&
    selectedVariant.stock !== null
      ? Number(selectedVariant.stock) || 0
      : null;
  const stockLimit = variantStock ?? product?.stock ?? 99;

  useEffect(() => {
    if (stockLimit !== null && stockLimit !== undefined) {
      const maxAllowed = Math.max(1, stockLimit);
      if (quantity > maxAllowed) {
        setQuantity(maxAllowed);
      }
    }
  }, [stockLimit, quantity]);

  const hasRequiredColor = !colorOptions.length || Boolean(selectedColor);
  const hasRequiredSize = !sizeOptions.length || Boolean(selectedSize);

  const canAdd =
    !isAllOutOfStock &&
    hasRequiredColor &&
    hasRequiredSize &&
    (!safeVariants.length || (Boolean(selectedVariant) && stockLimit > 0));

  const warningText = (() => {
    if (isAllOutOfStock || (selectedVariant && stockLimit <= 0))
      return "Thiết kế này hiện đã hết hàng.";
    if (colorOptions.length > 0 && !selectedColor)
      return "Vui lòng chọn màu sắc.";
    if (sizeOptions.length > 0 && !selectedSize)
      return "Vui lòng chọn kích cỡ.";
    return "";
  })();

  const handleColorClick = (color) => {
    if (isColorDisabled(color)) return;
    setSelectedColor(color);
    trackingService.trackVariantSelect(product, {
      color,
      size: selectedSize,
    });

    if (selectedSize && safeVariants.length > 0) {
      const isSizeValidForNewColor = safeVariants.some(
        (variant) =>
          variant.color === color &&
          variant.size === selectedSize &&
          (variant.stock === undefined ||
            variant.stock === null ||
            Number(variant.stock) > 0)
      );
      if (!isSizeValidForNewColor) {
        setSelectedSize("");
      }
    }
  };

  const handleSizeClick = (size) => {
    if (isSizeDisabled(size)) return;
    setSelectedSize(size);
    trackingService.trackVariantSelect(product, {
      color: selectedColor,
      size,
    });
  };

  const handleToggleFavorite = () => {
    const nextState = !isFavorite;
    if (productId) {
      trackingService.trackProductFavorite(productId, nextState);
    }
    toggleFavorite(product);
    toast.success(
      isFavorite
        ? `Đã xóa "${product.name}" khỏi danh sách yêu thích.`
        : `Đã lưu "${product.name}" vào danh sách yêu thích.`
    );
  };

  const buildCartPayload = () => ({
    product_id: product.id,
    variant_id: selectedVariant?._id || null,
    quantity: Number(quantity) || 1,
    price: Number(product.price) || 0,
  });

  const handleAddToCart = async () => {
    if (isAdding) return false;

    if (isAdmin) {
      toast.error("Tài khoản Quản trị viên không thể đặt hàng.");
      return false;
    }

    if (!canAdd) {
      toast.error(warningText || "Vui lòng chọn đầy đủ màu sắc và kích cỡ.");
      const optionsEl = document.getElementById("product-variant-options");
      if (optionsEl) {
        optionsEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }

    if (
      stockLimit !== null &&
      stockLimit !== undefined &&
      quantity > stockLimit
    ) {
      toast.error(`Kho chỉ còn lại ${stockLimit} sản phẩm.`);
      return false;
    }

    if (!isAuthenticated) {
      trackingService.trackAddToCartAttempt(
        product,
        quantity,
        selectedVariant,
        { reason: "unauthenticated" }
      );
      try {
        sessionStorage.setItem(
          "pending_add_to_cart",
          JSON.stringify({
            productId: product.id || product._id,
            variantId: selectedVariant?._id || null,
            quantity: Number(quantity) || 1,
            product,
            variant: selectedVariant,
          })
        );
      } catch {
        // ignore storage error
      }
      toast.info("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      navigate("/login");
      return false;
    }

    try {
      setIsAdding(true);
      const result = await addCartItemService(buildCartPayload());
      if (result && result.success !== false) {
        trackingService.trackAddToCart(product, quantity, selectedVariant);
        window.dispatchEvent(
          new CustomEvent("cartUpdated", {
            detail: {
              cart: result?.cart,
              totalQuantity: result?.cart?.total_items ?? 0,
              total: result?.cart?.total_price ?? 0,
            },
          })
        );
        window.dispatchEvent(
          new CustomEvent("flyToCart", {
            detail: { src: product.images?.[0] || "" },
          })
        );
        toast.success("Đã thêm thiết kế vào giỏ hàng.");
        return true;
      }
      toast.error(result?.message || "Thêm vào giỏ hàng thất bại.");
      return false;
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      toast.error("Thêm vào giỏ hàng thất bại.");
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để tiến hành mua hàng.");
      navigate("/login");
      return;
    }

    if (isAdmin) {
      toast.error("Tài khoản Quản trị viên không thể đặt hàng.");
      return;
    }

    if (!canAdd) {
      toast.error(warningText || "Vui lòng chọn đầy đủ màu sắc và kích cỡ.");
      const optionsEl = document.getElementById("product-variant-options");
      if (optionsEl) {
        optionsEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (
      stockLimit !== null &&
      stockLimit !== undefined &&
      quantity > stockLimit
    ) {
      toast.error(`Kho chỉ còn lại ${stockLimit} sản phẩm.`);
      return;
    }

    navigate("/checkout", {
      state: {
        checkoutItems: [
          {
            _id: selectedVariant?._id || product.id,
            product_id: product.id,
            variant_id: selectedVariant?._id || null,
            product_name: product.name,
            name: product.name,
            product_image:
              selectedVariant?.image_url || product.images?.[0] || "",
            image: selectedVariant?.image_url || product.images?.[0] || "",
            price: Number(product.price) || 0,
            new_price: Number(product.price) || 0,
            oldPrice: Number(product.oldPrice) || 0,
            old_price: Number(product.oldPrice) || 0,
            quantity: Number(quantity) || 1,
            stock: stockLimit,
            color: selectedColor || selectedVariant?.color || "",
            size: selectedSize || selectedVariant?.size || "",
            variant:
              [selectedColor, selectedSize].filter(Boolean).join(" - ") ||
              "Mặc định",
          },
        ],
      },
    });
  };

  return (
    <div id="product-variant-options" className="space-y-3">
      {/* 1. Color Selector */}
      {colorOptions.length > 0 && (
        <fieldset className="space-y-1.5">
          <legend className="flex w-full items-center justify-between text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground">
            <span>Màu sắc</span>
            {selectedColor && (
              <span className="font-normal text-muted-foreground lowercase">
                chọn: <strong className="text-foreground capitalize">{selectedColor}</strong>
              </span>
            )}
          </legend>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((color) => {
              const disabled = isColorDisabled(color);
              const selected = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleColorClick(color)}
                  className={`touch-target h-8 inline-flex items-center gap-1.5 border px-3 text-xs transition-colors ${
                    disabled
                      ? "cursor-not-allowed border-dashed border-border opacity-35 line-through"
                      : selected
                      ? "border-foreground bg-primary font-semibold text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-foreground"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: getColorHex(color) }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{color}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* 2. Size Selector */}
      {sizeOptions.length > 0 && (
        <fieldset className="space-y-1.5">
          <legend className="flex w-full items-center justify-between text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground">
            <span>Kích cỡ</span>
            {selectedSize && (
              <span className="font-normal text-muted-foreground lowercase">
                chọn: <strong className="text-foreground uppercase">{selectedSize}</strong>
              </span>
            )}
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {sizeOptions.map((size) => {
              const disabled = isSizeDisabled(size);
              const selected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSizeClick(size)}
                  className={`touch-target h-8 min-w-[36px] border px-2.5 text-xs font-medium uppercase transition-colors ${
                    disabled
                      ? "cursor-not-allowed border-dashed border-border opacity-35 line-through"
                      : selected
                      ? "border-foreground bg-primary font-semibold text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-foreground"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* 3. Quantity & Stock Status - ON SAME LINE */}
      <div className="flex items-center justify-between gap-3 border-y border-border/40 py-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground">
            Số lượng
          </span>
          <div className="inline-flex items-center border border-border bg-card h-8">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || isAllOutOfStock}
              className="w-7 h-full inline-flex items-center justify-center text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-35"
              aria-label="Giảm số lượng"
            >
              −
            </button>
            <strong className="w-8 text-center text-xs font-semibold tabular-nums text-foreground">
              {isAllOutOfStock ? 0 : quantity}
            </strong>
            <button
              type="button"
              onClick={() =>
                setQuantity((q) => Math.min(stockLimit || 99, q + 1))
              }
              disabled={quantity >= (stockLimit || 99) || isAllOutOfStock}
              className="w-7 h-full inline-flex items-center justify-center text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-35"
              aria-label="Tăng số lượng"
            >
              +
            </button>
          </div>
        </div>

        {stockLimit !== null && stockLimit !== undefined && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {stockLimit > 0 ? `Còn ${stockLimit} sản phẩm` : "Hết hàng"}
          </span>
        )}
      </div>

      {/* Selection Notice (Compact 1-line) */}
      {warningText && (
        <p className="border-l-2 border-foreground bg-secondary/50 px-2.5 py-1 text-[11px] text-muted-foreground truncate">
          {warningText}
        </p>
      )}

      {/* 4. Desktop/Primary Purchase Actions (Sticky at bottom of right column) */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-xs pt-2.5 pb-1 border-t border-border/40 z-10 flex gap-2">
        <button
          type="button"
          data-buy-action="add-to-cart"
          onClick={handleAddToCart}
          disabled={isAdding || !canAdd || isAdmin}
          className="touch-target flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 border border-foreground bg-card px-3 py-2 text-xs font-semibold tracking-[0.14em] uppercase text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isAdding ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <ShoppingBag size={15} strokeWidth={1.5} />
          )}
          <span className="truncate">
            {isAdmin
              ? "Admin"
              : isAdding
              ? "Đang xử lý..."
              : "Thêm vào giỏ"}
          </span>
        </button>

        <button
          type="button"
          data-buy-action="buy-now"
          onClick={handleBuyNow}
          disabled={isAdding || !canAdd || isAdmin}
          className="touch-target flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 bg-primary px-3 py-2 text-xs font-semibold tracking-[0.14em] uppercase text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Zap size={15} strokeWidth={1.5} />
          <span className="truncate">{isAdmin ? "Admin" : "Mua ngay"}</span>
        </button>

        <button
          type="button"
          data-buy-action="toggle-favorite"
          onClick={handleToggleFavorite}
          className="touch-target min-h-[42px] min-w-[42px] inline-flex items-center justify-center border border-border bg-card px-2.5 text-foreground transition-colors hover:border-foreground shrink-0"
          aria-label={isFavorite ? "Bỏ yêu thích" : "Lưu vào yêu thích"}
          aria-pressed={isFavorite}
        >
          <Heart
            size={16}
            strokeWidth={1.5}
            fill={isFavorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* 5. Mobile Fixed Bottom Quick Action Bar (< 1024px) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-4 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col min-w-0 pr-2">
          <span className="block text-[10px] font-semibold tracking-wider uppercase text-muted-foreground truncate">
            {selectedVariant
              ? [selectedColor, selectedSize].filter(Boolean).join(" / ") || product.name
              : product.name}
          </span>
          <div className="flex items-baseline gap-2">
            <strong className="text-sm font-bold tabular-nums text-foreground">
              {product.price > 0 ? formatCurrency(product.price) : "Liên hệ"}
            </strong>
            {product.oldPrice > product.price && product.price > 0 && (
              <del className="text-[11px] tabular-nums text-muted-foreground line-through">
                {formatCurrency(product.oldPrice)}
              </del>
            )}
          </div>
        </div>

        <button
          type="button"
          data-buy-action="mobile-add-to-cart"
          onClick={handleAddToCart}
          disabled={isAdding || !canAdd || isAdmin}
          className="touch-target min-h-[44px] px-4 bg-primary text-primary-foreground font-semibold text-xs tracking-[0.06em] sm:tracking-[0.14em] uppercase flex items-center justify-center gap-2 shrink-0 transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isAdding ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <ShoppingBag size={15} strokeWidth={1.5} />
          )}
          <span className="truncate">{isAdmin ? "Admin" : isAdding ? "Đang xử lý..." : "Thêm vào giỏ"}</span>
        </button>
      </div>
    </div>
  );
};

export default ProductActions;