import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/auth.store";
import { addCartItemService } from "@/services/cartItem.service";
import StarRating from "../../components/Star";

const ProductInfo = ({ product, variants = [], selected, updateSelected }) => {
  if (!product) return <p className="text-center py-10">Không tìm thấy sản phẩm</p>;

  const navigate = useNavigate();
  const { isAuthenticated: isLoggedIn } = useAuthStore();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const safeVariants = Array.isArray(variants) ? variants : [];
  
  // Combine product gallery images
  const images = [
    ...(product?.displayProduct || []),
    ...safeVariants.map((v) => v.image_url).filter(Boolean),
  ];
  if (images.length === 0 && product.image) {
    images.push(product.image);
  }

  // Calculate discount percentage
  const discount =
    product.old_price > 0
      ? Math.round(
          ((product.old_price - product.new_price) / product.old_price) * 100,
        )
      : 0;

  const hasVariants = safeVariants.length > 0;
  const simpleStock = Number(product?.stock ?? 0);

  // Get available sizes & colors
  const availableColors = hasVariants ? [...new Set(safeVariants.map((v) => v.color))] : [];
  const availableSizes = hasVariants ? [...new Set(safeVariants.map((v) => v.size))] : [];

  // Group sizes by selected color to disable unavailable combinations
  const sizesBySelectedColor = safeVariants.reduce((acc, v) => {
    if (!acc[v.color]) {
      acc[v.color] = [];
    }
    if (!acc[v.color].includes(v.size)) {
      acc[v.color].push(v.size);
    }
    return acc;
  }, {});

  const selectedVariant = hasVariants
    ? safeVariants.find(
        (v) => v.color === selected.color && v.size === selected.size,
      ) || null
    : null;

  const currentStock = hasVariants
    ? (selectedVariant?.stock ?? 0)
    : simpleStock;

  const canAddToCart = hasVariants
    ? Boolean(
        selected.color &&
        selected.size &&
        selected.quantity > 0 &&
        selectedVariant,
      )
    : selected.quantity > 0;

  // Formatter for prices
  const formatPrice = (val) => {
    if (val > 1000) {
      return val.toLocaleString("vi-VN") + "đ";
    }
    return "$" + val;
  };

  // Warning text
  const warningText = (() => {
    if (hasVariants) {
      if (!selected.color) return "Vui lòng chọn màu sắc";
      if (!selected.size) return "Vui lòng chọn kích cỡ";
      if (currentStock <= 0) return "Sản phẩm phiên bản này đã hết hàng";
      return "";
    }
    if (product?.stock !== undefined && simpleStock <= 0) return "Sản phẩm đã hết hàng";
    return "";
  })();

  // Handlers
  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!canAddToCart) {
      toast.error(warningText || "Vui lòng chọn đầy đủ phân loại và số lượng");
      return;
    }

    try {
      setIsAddingToCart(true);

      const payload = {
        product_id: product._id || product.id,
        variant_id: selectedVariant?._id || null,
        quantity: Number(selected.quantity) || 1,
        price: Number(product.new_price) || 0,
      };

      const result = await addCartItemService(payload);

      window.dispatchEvent(
        new CustomEvent("cartUpdated", {
          detail: {
            cart: result.cart,
            totalQuantity: result.cart?.total_items ?? 0,
            total: result.cart?.total_price ?? 0,
          },
        }),
      );

      toast.success("Đã thêm sản phẩm vào giỏ hàng!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Thêm vào giỏ hàng thất bại!");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (!canAddToCart) {
      toast.error(warningText || "Vui lòng chọn đầy đủ phân loại và số lượng");
      return;
    }

    try {
      const checkoutItems = [
        {
          _id: selectedVariant?._id || product._id || product.id,
          product_id: product._id || product.id,
          variant_id: selectedVariant?._id || null,
          product_name: product.name,
          product_image: selectedVariant?.image_url || product.image || images[0],
          price: Number(product.new_price) || 0,
          oldPrice: Number(product.old_price) || 0,
          quantity: Number(selected.quantity) || 1,
          variant: selectedVariant
            ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(" - ")
            : "Mặc định",
        },
      ];

      navigate("/checkout", { state: { checkoutItems } });
    } catch (error) {
      console.error("Lỗi mua ngay:", error);
    }
  };

  return (
    <div className="pd-product-main animate-in fade-in duration-300">
      {/* Left Column - Gallery */}
      <div>
        <div className="pd-gallery-main">
          {images.length > 0 ? (
            <img
              src={images[activeImageIndex]}
              alt={product.name}
              className="transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
              Không có hình ảnh
            </div>
          )}
        </div>
        
        {images.length > 1 && (
          <div className="pd-thumbs">
            {images.slice(0, 4).map((img, index) => (
              <div
                key={index}
                onClick={() => setActiveImageIndex(index)}
                className={`pd-thumb ${activeImageIndex === index ? "active" : ""}`}
              >
                <img src={img} alt={`Thumbnail ${index}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column - Product Info */}
      <div className="pd-product-info space-y-6 text-left">
        {/* Title */}
        <h1 className="pd-product-title text-slate-900 dark:text-white font-serif">{product.name}</h1>
        
        {/* Rating stars */}
        <div className="pd-stars">
          <StarRating rating={product.rating || 5} />
          <span className="pd-review-count font-sans">({product.rating || 4.5})</span>
          {product.sold > 0 && (
            <span className="text-xs text-slate-400 ml-2">Đã bán {product.sold}</span>
          )}
        </div>

        {/* Pricing */}
        <div className="pd-price flex items-baseline gap-3 text-slate-900 dark:text-white">
          <span className="text-2xl font-bold text-red-600 dark:text-red-500">
            {formatPrice(product.new_price)}
          </span>
          {product.old_price > product.new_price && (
            <>
              <span className="text-sm line-through text-slate-400">
                {formatPrice(product.old_price)}
              </span>
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                -{discount}%
              </span>
            </>
          )}
        </div>

        {/* Size Guide full-width button */}
        <button
          type="button"
          onClick={() => toast.info("Bảng hướng dẫn kích cỡ đang được phát triển")}
          className="pd-size-guide-btn"
        >
          Size Guide
        </button>

        {/* Size Selector */}
        {hasVariants && availableSizes.length > 0 && (
          <div>
            <div className="pd-label">Kích thước (Size)</div>
            <div className="pd-size-options">
              {availableSizes.map((size) => {
                const isActive = selected.size === size;
                // Size is disabled if color is selected and this size is not available for that color
                const isDisabled = selected.color
                  ? !(sizesBySelectedColor[selected.color] || []).includes(size)
                  : false;

                return (
                  <button
                    key={size}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => updateSelected("size", size)}
                    className={`pd-size-btn ${isActive ? "active" : ""}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Color Selector */}
        {hasVariants && availableColors.length > 0 && (
          <div>
            <div className="pd-label">Màu sắc (Color)</div>
            <div className="pd-color-options">
              {availableColors.map((color) => {
                const isActive = selected.color === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      updateSelected("color", color);
                      // Clear size if it's not available in the new color
                      if (selected.size && !(sizesBySelectedColor[color] || []).includes(selected.size)) {
                        updateSelected("size", null);
                      }
                    }}
                    className={`pd-color-btn ${isActive ? "active" : ""}`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity Row */}
        <div>
          <div className="pd-label">Số lượng (Quantity)</div>
          <div className="pd-qty-row">
            <button
              type="button"
              onClick={() => updateSelected("quantity", Math.max(1, selected.quantity - 1))}
              disabled={selected.quantity <= 1}
              className="pd-qty-btn"
            >
              −
            </button>
            <div className="pd-qty-val text-slate-800 dark:text-slate-100">
              {selected.quantity}
            </div>
            <button
              type="button"
              onClick={() => updateSelected("quantity", Math.min(currentStock || 99, selected.quantity + 1))}
              disabled={selected.quantity >= (currentStock || 99)}
              className="pd-qty-btn"
            >
              +
            </button>
          </div>
          {warningText && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-2 font-semibold">
              {warningText}
            </p>
          )}
          {hasVariants && selected.color && selected.size && currentStock > 0 && (
            <p className="text-xs text-slate-400 mt-1">Còn lại {currentStock} sản phẩm trong kho</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAddingToCart || !canAddToCart}
            className="pd-btn-cart hover:scale-[1.01] transition-transform active:scale-[0.99] font-sans"
          >
            {isAddingToCart ? "Đang xử lý..." : "Thêm vào giỏ hàng"}
          </button>
          
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!canAddToCart || isAddingToCart}
            className="pd-btn-buy hover:scale-[1.01] transition-transform active:scale-[0.99] font-sans"
          >
            Mua ngay
          </button>
        </div>

        {/* Trust assurance badges */}
        <div className="pd-trust-row pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="pd-trust-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="pd-trust-icon"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <div>
              <strong>Miễn phí vận chuyển</strong>
              <span className="pd-trust-sub">Cho tất cả đơn hàng từ $100</span>
            </div>
          </div>
          
          <div className="pd-trust-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="pd-trust-icon"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <div>
              <strong>Thanh toán bảo mật</strong>
              <span className="pd-trust-sub">Cổng thanh toán mã hóa bảo mật SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
