import { useAuth } from "@/context/AuthContext";
import { addCartItemService } from "@/services/cartItem.service";
import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const PurchaseActions = ({ product, variants = [], selected, totalPrice }) => {
  const { isLoggedIn } = useAuth();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const imgRef = useRef(null);
  const navigate = useNavigate();

  if (!product) return null;

  const hasVariants = variants.length > 0;
  const selectedVariant = hasVariants
    ? variants.find(
        (variant) =>
          variant.color === selected.color && variant.size === selected.size,
      ) || null
    : null;

  const canAddToCart = hasVariants
    ? Boolean(
        selected.color &&
        selected.size &&
        selected.quantity > 0 &&
        selectedVariant,
      )
    : selected.quantity > 0;

  const handleAddToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!canAddToCart) {
      // alert("Vui lòng chọn đầy đủ");
      toast.error("Vui lòng chọn đầy đủ màu sắc, kích thước và số lượng");
      return false;
    }

    try {
      setIsAddingToCart(true);

      const payload = {
        product_id: product._id,
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

      const sourceImage = imgRef.current;
      const sourceElement = sourceImage || event?.currentTarget || null;
      const sourceRect = sourceElement?.getBoundingClientRect?.() || {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      };

      window.dispatchEvent(
        new CustomEvent("flyToCart", {
          detail: {
            img: sourceImage,
            sourceRect,
          },
        }),
      );

      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      return false;
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async (event) => {
    event.preventDefault();

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (!canAddToCart) {
      toast.error("Vui lòng chọn đầy đủ màu sắc, kích thước và số lượng");
      return;
    }

    try {
      setIsAddingToCart(true);

      // Tạo checkoutItems trực tiếp, không cần thêm vào giỏ
      const checkoutItems = [
        {
          _id: selectedVariant?._id || product._id,
          product_id: product._id,
          variant_id: selectedVariant?._id || null,
          product_name: product.name,
          product_image: product.image,
          price: Number(product.new_price) || 0,
          oldPrice: Number(product.price) || 0,
          quantity: Number(selected.quantity) || 1,
          variant: selectedVariant
            ? [selectedVariant.color, selectedVariant.size]
                .filter(Boolean)
                .join(" - ")
            : "Mặc định",
        },
      ];

      navigate("/checkout", { state: { checkoutItems } });
    } catch (error) {
      console.error("Lỗi mua ngay:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-[0_-2px_20px_rgba(0,0,0,0.08)]">
      <img
        ref={imgRef}
        src={product.image}
        alt=""
        className="opacity-0 pointer-events-none"
      />

      <div className="grid grid-cols-2">
        {/* ADD TO CART */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAddingToCart || !canAddToCart}
          className={`
          relative py-4 font-semibold text-sm uppercase tracking-wide
          border-r transition-all duration-200
          ${
            isAddingToCart || !canAddToCart
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-black hover:bg-gray-50 active:scale-[0.98]"
          }
        `}
        >
          {isAddingToCart ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
              Đang thêm...
            </span>
          ) : (
            `Thêm vào giỏ (${selected.quantity})`
          )}
        </button>

        {/* BUY NOW */}
        {/* BUY NOW */}
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!canAddToCart || isAddingToCart}
          className={`
    flex items-center justify-center py-4 font-semibold text-sm uppercase tracking-wide
    transition-all duration-200
    ${
      !canAddToCart || isAddingToCart
        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
        : "bg-black text-white hover:bg-gray-900 active:scale-[0.98]"
    }
  `}
        >
          Mua ngay ({totalPrice.toLocaleString()}đ)
        </button>
      </div>
    </div>
  );
};

export default PurchaseActions;
