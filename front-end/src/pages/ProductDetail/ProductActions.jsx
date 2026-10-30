import trackingService from "@/services/tracking.service";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ShoppingBag, Zap, Check, LoaderCircle } from "lucide-react";
import { addCartItemService } from "@/services/cartItem.service";
import { useAuthStore } from "@/store/auth.store";
import { getColorHex } from "../ProductSearch/productAdapter";

const uniqueValues = (values) => [...new Set(values.filter(Boolean))];

const ProductActions = ({ product, variants = [] }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const role = user?.role || user?.data?.role || "";
  const isAdmin = role === "admin";
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const safeVariants = useMemo(() => {
    if (product && Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants;
    }
    return Array.isArray(variants) ? variants : [];
  }, [product, variants]);

  const colorOptions = useMemo(() => {
    if (safeVariants.length > 0) {
      return uniqueValues(safeVariants.map((variant) => variant.color));
    }
    return Array.isArray(product.colors) ? product.colors : [];
  }, [safeVariants, product.colors]);

  const sizeOptions = useMemo(() => {
    if (safeVariants.length > 0) {
      const variantsByColor = selectedColor
        ? safeVariants.filter((variant) => variant.color === selectedColor)
        : safeVariants;

      return uniqueValues(variantsByColor.map((variant) => variant.size));
    }
    return Array.isArray(product.sizes) ? product.sizes : [];
  }, [safeVariants, selectedColor, product.sizes]);

  const isColorDisabled = (color) => {
    if (safeVariants.length === 0) return false;
    const variantsForColor = safeVariants.filter((v) => v.color === color);
    return variantsForColor.every(
      (v) => v.stock !== undefined && v.stock !== null && Number(v.stock) <= 0
    );
  };

  const isSizeDisabled = (size) => {
    if (safeVariants.length === 0) return false;
    if (selectedColor) {
      const variant = safeVariants.find((v) => v.color === selectedColor && v.size === size);
      return variant
        ? variant.stock !== undefined && variant.stock !== null && Number(variant.stock) <= 0
        : true;
    } else {
      const variantsForSize = safeVariants.filter((v) => v.size === size);
      return variantsForSize.every(
        (v) => v.stock !== undefined && v.stock !== null && Number(v.stock) <= 0
      );
    }
  };

  const isAllOutOfStock = useMemo(() => {
    if (safeVariants.length > 0) {
      return safeVariants.every(
        (v) => v.stock !== undefined && v.stock !== null && Number(v.stock) <= 0
      );
    }
    return (
      product.isSoldOut ||
      (product.stock !== null && product.stock !== undefined && product.stock <= 0)
    );
  }, [safeVariants, product]);

  const selectedVariant = useMemo(() => {
    if (!safeVariants.length) return null;

    return (
      safeVariants.find((variant) => {
        const matchesColor = colorOptions.length
          ? variant.color === selectedColor
          : true;
        const matchesSize = sizeOptions.length ? variant.size === selectedSize : true;

        return matchesColor && matchesSize;
      }) || null
    );
  }, [colorOptions.length, safeVariants, selectedColor, selectedSize, sizeOptions.length]);

  const variantStock =
    selectedVariant && selectedVariant.stock !== undefined && selectedVariant.stock !== null
      ? Number(selectedVariant.stock) || 0
      : null;
  const stockLimit = variantStock ?? product.stock ?? 99;

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
    if (isAllOutOfStock || (selectedVariant && stockLimit <= 0)) return "Hết hàng";
    if (colorOptions.length > 0 && !selectedColor) return "Vui lòng chọn màu sắc";
    if (sizeOptions.length > 0 && !selectedSize) return "Vui lòng chọn kích thước";
    return "";
  })();

  const handleColorClick = (color) => {
    if (isColorDisabled(color)) return;
    setSelectedColor(color);
    trackingService.trackVariantSelect(product, { color, size: selectedSize });

    // size đang chọn phải reset nếu không còn hợp lệ
    if (selectedSize && safeVariants.length > 0) {
      const isSizeValidForNewColor = safeVariants.some(
        (variant) =>
          variant.color === color &&
          variant.size === selectedSize &&
          (variant.stock === undefined || variant.stock === null || Number(variant.stock) > 0)
      );

      if (!isSizeValidForNewColor) {
        setSelectedSize("");
      }
    }
  };

  const handleSizeClick = (size) => {
    if (isSizeDisabled(size)) return;
    setSelectedSize(size);
    trackingService.trackVariantSelect(product, { color: selectedColor, size });
  };

  const buildCartPayload = () => ({
    product_id: product.id,
    variant_id: selectedVariant?._id || null,
    quantity: Number(quantity) || 1,
    price: Number(product.price) || 0,
  });

  const handleAddToCart = async () => {
    console.log("Add to cart:", {
      productId: product.id,
      quantity,
      selectedSize,
      selectedColor
    });

    if (isAdmin) {
      toast.error("Quản trị viên không thể mua hàng!");
      return false;
    }

    if (!canAdd) {
      toast.error(warningText || "Vui lòng chọn đầy đủ thông tin sản phẩm");
      return false;
    }

    if (stockLimit !== null && stockLimit !== undefined && quantity > stockLimit) {
      toast.error(`Số lượng trong kho không đủ (chỉ còn lại ${stockLimit} sản phẩm)`);
      return false;
    }

    try {
      setIsAdding(true);
      const result = await addCartItemService(buildCartPayload());

      trackingService.trackEvent({
        event_type: "add_to_cart",
        product_id: product?.id || product?._id,
        category_id: product?.category_id,
        meta: {
          price: product?.price || product?.new_price || 0,
          quantity,
        },
      });

      window.dispatchEvent(
        new CustomEvent("cartUpdated", {
          detail: {
            cart: result?.cart,
            totalQuantity: result?.cart?.total_items ?? 0,
            total: result?.cart?.total_price ?? 0,
          },
        }),
      );

      toast.success("Đã thêm sản phẩm vào giỏ hàng");
      return true;
    } catch (error) {
      console.error("Không thể thêm sản phẩm vào giỏ hàng:", error);
      toast.error("Thêm vào giỏ hàng thất bại");
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (isAdmin) {
      toast.error("Quản trị viên không thể mua hàng!");
      return;
    }

    if (!canAdd) {
      toast.error(warningText || "Vui lòng chọn đầy đủ thông tin sản phẩm");
      return;
    }

    if (stockLimit !== null && stockLimit !== undefined && quantity > stockLimit) {
      toast.error(`Số lượng trong kho không đủ (chỉ còn lại ${stockLimit} sản phẩm)`);
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
            product_image: selectedVariant?.image_url || product.images[0],
            price: Number(product.price) || 0,
            oldPrice: Number(product.oldPrice) || 0,
            quantity: Number(quantity) || 1,
            variant: [selectedColor, selectedSize].filter(Boolean).join(" - ") || "Mặc định",
          },
        ],
      },
    });
  };

  return (
    <div className="product-actions flex flex-col gap-6 lg:gap-3 pt-2 lg:pt-1">
      {/* 1. Nhóm chọn Màu sắc (Color Swatches) */}
      {colorOptions.length > 0 && (
        <fieldset className="product-actions__group flex flex-col gap-2.5 lg:gap-1.5">
          <legend className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center justify-between w-full">
            <span>Màu sắc</span>
            {selectedColor && (
              <span className="text-xs font-semibold text-[#05251C] capitalize">
                : {selectedColor}
              </span>
            )}
          </legend>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((color) => {
              const isDisabled = isColorDisabled(color);
              const isSelected = selectedColor === color;
              const hex = getColorHex(color);
              const isLightColor = ["#ffffff", "#f5ebe1", "#e5d9c5", "#e2e8f0"].includes(
                hex.toLowerCase(),
              );

              return (
                <button
                  type="button"
                  key={color}
                  disabled={isDisabled}
                  onClick={() => handleColorClick(color)}
                  className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                    isDisabled
                      ? "opacity-35 cursor-not-allowed border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 line-through"
                      : isSelected
                      ? "border-neutral-900 bg-neutral-900 text-white shadow-xs"
                      : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex-shrink-0 border ${
                      isLightColor ? "border-neutral-300" : "border-black/10"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                  <span className="capitalize">{color}</span>
                  {isSelected && <Check size={12} className="text-white ml-0.5" />}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* 2. Nhóm chọn Kích thước (Size Box Pills) */}
      {sizeOptions.length > 0 && (
        <fieldset className="product-actions__group flex flex-col gap-2.5 lg:gap-1.5">
          <legend className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center justify-between w-full">
            <span>Kích thước</span>
            {selectedSize && (
              <span className="text-xs font-semibold text-[#05251C]">
                : {selectedSize}
              </span>
            )}
          </legend>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((size) => {
              const isDisabled = isSizeDisabled(size);
              const isSelected = selectedSize === size;

              return (
                <button
                  type="button"
                  key={size}
                  disabled={isDisabled}
                  onClick={() => handleSizeClick(size)}
                  className={`min-w-[44px] h-10 lg:h-9 px-3 flex items-center justify-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isDisabled
                      ? "opacity-35 cursor-not-allowed border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 line-through"
                      : isSelected
                      ? "border-[#05251C] bg-[#05251C] text-[#F5DD20] shadow-xs"
                      : "border-neutral-200 bg-white text-neutral-800 hover:border-[#05251C] hover:bg-neutral-50"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* 3. Điều khiển Số lượng */}
      <div className="flex items-center gap-4 pt-1">
        <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
          Số lượng
        </span>
        <div className="flex items-center border border-neutral-200 rounded-xl bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1 || isAllOutOfStock}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition font-bold text-base cursor-pointer"
            aria-label="Giảm số lượng"
          >
            -
          </button>
          <strong className="w-10 text-center font-bold text-sm text-neutral-900 tabular-nums">
            {isAllOutOfStock ? 0 : quantity}
          </strong>
          <button
            type="button"
            onClick={() =>
              setQuantity((current) => Math.min(stockLimit || 99, current + 1))
            }
            disabled={quantity >= (stockLimit || 99) || isAllOutOfStock}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition font-bold text-base cursor-pointer"
            aria-label="Tăng số lượng"
          >
            +
          </button>
        </div>
        {stockLimit !== null && stockLimit < 10 && stockLimit > 0 && (
          <span className="text-[11px] font-bold text-[#05251C] bg-[#F5DD20]/25 border border-[#F5DD20]/60 px-2 py-0.5 rounded-md">
            Chỉ còn {stockLimit} sản phẩm
          </span>
        )}
      </div>

      {warningText && (
        <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          {warningText}
        </p>
      )}

      {/* 4. Nút Hành động Mua hàng */}
      <div className="flex flex-col sm:flex-row gap-3 lg:gap-2 pt-2 lg:pt-1">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding || !canAdd || isAdmin}
          className="flex-1 h-12 lg:h-10 rounded-xl border-2 border-[#05251C] bg-white text-[#05251C] hover:bg-[#05251C] hover:text-[#F5DD20] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isAdding ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <ShoppingBag size={16} />
          )}
          <span>
            {isAdmin ? "Không dành cho Admin" : (isAdding ? "Đang xử lý..." : "Thêm vào giỏ hàng")}
          </span>
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isAdding || !canAdd || isAdmin}
          className="flex-1 h-12 lg:h-10 rounded-xl bg-[#05251C] text-[#F5DD20] hover:bg-[#073D2A] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
        >
          <Zap size={16} />
          <span>{isAdmin ? "Không dành cho Admin" : "Mua ngay"}</span>
        </button>
      </div>
    </div>
  );
};

export default ProductActions;
