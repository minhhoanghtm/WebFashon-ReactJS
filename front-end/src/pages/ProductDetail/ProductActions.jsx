import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ShoppingBag, Zap } from "lucide-react";
import { addCartItemService } from "@/services/cartItem.service";
import { useAuthStore } from "@/store/auth.store";

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
    <div className="product-actions">
      {colorOptions.length > 0 && (
        <fieldset className="product-actions__group">
          <legend>Màu sắc</legend>
          <div className="product-actions__choices">
            {colorOptions.map((color) => (
              <button
                type="button"
                key={color}
                disabled={isColorDisabled(color)}
                className={`product-option product-color ${
                  selectedColor === color ? "is-active product-option-active" : ""
                } ${isColorDisabled(color) ? "product-option-disabled" : ""}`}
                onClick={() => handleColorClick(color)}
              >
                {color}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {sizeOptions.length > 0 && (
        <fieldset className="product-actions__group">
          <legend>Kích thước</legend>
          <div className="product-actions__choices">
            {sizeOptions.map((size) => (
              <button
                type="button"
                key={size}
                disabled={isSizeDisabled(size)}
                className={`product-option product-size ${
                  selectedSize === size ? "is-active product-option-active" : ""
                } ${isSizeDisabled(size) ? "product-option-disabled" : ""}`}
                onClick={() => handleSizeClick(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="product-actions__quantity product-quantity">
        <span>Số lượng</span>
        <div>
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1 || isAllOutOfStock}
            aria-label="Giảm số lượng"
          >
            -
          </button>
          <strong>{isAllOutOfStock ? 0 : quantity}</strong>
          <button
            type="button"
            onClick={() =>
              setQuantity((current) => Math.min(stockLimit || 99, current + 1))
            }
            disabled={quantity >= (stockLimit || 99) || isAllOutOfStock}
            aria-label="Tăng số lượng"
          >
            +
          </button>
        </div>
      </div>

      {warningText && <p className="product-actions__warning">{warningText}</p>}

      <div className="product-actions__buttons">
        <button
          type="button"
          className="product-actions__cart"
          onClick={handleAddToCart}
          disabled={isAdding || !canAdd || isAdmin}
        >
          <ShoppingBag size={18} aria-hidden="true" />
          {isAdmin ? "Không dành cho Admin" : (isAdding ? "Đang xử lý..." : "Thêm vào giỏ hàng")}
        </button>
        <button
          type="button"
          className="product-actions__buy"
          onClick={handleBuyNow}
          disabled={isAdding || !canAdd || isAdmin}
        >
          <Zap size={18} aria-hidden="true" />
          {isAdmin ? "Không dành cho Admin" : "Mua ngay"}
        </button>
      </div>
    </div>
  );
};

export default ProductActions;
