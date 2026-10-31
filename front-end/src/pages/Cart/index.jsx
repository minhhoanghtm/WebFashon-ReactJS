import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { getCartService } from "@/services/cart.service";
import {
  getCartItemsService,
  updateCartItemService,
  deleteCartItemService,
  addCartItemService,
} from "@/services/cartItem.service";
import { validateVoucherService } from "@/services/voucher.service";
import trackingService from "@/services/tracking.service";

import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import CouponSection from "@/components/cart/CouponSection";
import EmptyCart from "@/components/cart/EmptyCart";
import CartSkeleton from "@/components/cart/CartSkeleton";
import RecommendedProducts from "@/components/cart/RecommendedProducts";

const normalizeImageUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (url.includes("example.com")) return "";
  if (url.includes("webfashon-reactjs.onrender.com")) {
    return url.replace(
      /https?:\/\/webfashon-reactjs\.onrender\.com/,
      "http://localhost:5000"
    );
  }
  return url;
};

const normalizeCartItems = (backendItems = []) => {
  if (!Array.isArray(backendItems)) return [];
  return backendItems.map((item) => {
    if (item.name && item.new_price !== undefined) return item;

    const product = item.product_id || {};
    const variant = item.variant_id || {};

    const rawImages = Array.isArray(product.displayProduct)
      ? product.displayProduct.map(normalizeImageUrl).filter(Boolean)
      : product.displayProduct
      ? [normalizeImageUrl(product.displayProduct)].filter(Boolean)
      : [];

    const variantImage = normalizeImageUrl(variant.image_url);
    const productImage = normalizeImageUrl(
      rawImages[0] ||
        product.image ||
        product.imageUrl ||
        product.image_url ||
        ""
    );

    return {
      _id: item._id,
      product_id: product._id || product.id,
      slug: product.slug || product._id || product.id,
      name: product.name || "Thiết kế thời trang",
      category: product.category_id?.name || "Bộ sưu tập",
      image: variantImage || productImage || "",
      productImage,
      images: [variantImage, ...rawImages, productImage].filter(Boolean),
      new_price: Number(product.new_price ?? item.price ?? 0),
      old_price: Number(product.old_price ?? 0),
      price: Number(item.price ?? product.new_price ?? 0),
      quantity: Number(item.quantity || 1),
      stock: variant.stock ?? product.stock ?? 99,
      campaign: item.campaign || product.campaign || null,
      price_changed: Boolean(item.price_changed),
      variants: variant._id
        ? [
            {
              _id: variant._id,
              color: variant.color,
              size: variant.size,
              image_url: variant.image_url,
              stock: variant.stock,
            },
          ]
        : [],
    };
  });
};

const extractCartId = (cartRes) => {
  if (!cartRes || !cartRes.success) return null;
  const data = cartRes.data;
  if (Array.isArray(data)) return data[0]?._id || null;
  return data?._id || null;
};

const Cart = () => {
  const navigate = useNavigate();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";
  useDocumentTitle(`Giỏ hàng — ${siteName}`);

  const { isAuthenticated: isLoggedIn, user } = useAuthStore();
  const { items, setCartItems } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  // Voucher states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [appliedShippingCoupon, setAppliedShippingCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState(null);

  useEffect(() => {
    const role = user?.role || user?.data?.role || "";
    if (role === "admin") {
      toast.error("Quản trị viên không thể thực hiện chức năng mua hàng!");
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch cart details from backend on mount
  useEffect(() => {
    let isMounted = true;
    const fetchCartData = async () => {
      if (!isLoggedIn) {
        setCartItems([]);
        setSelectedItemIds([]);
        return;
      }
      try {
        setLoading(true);
        const cartRes = await getCartService();
        const cartId = extractCartId(cartRes);
        if (cartId) {
          const itemsRes = await getCartItemsService(cartId);
          const normalized = normalizeCartItems(itemsRes?.data || []);
          if (!isMounted) return;
          setCartItems(normalized);
          setSelectedItemIds(
            normalized
              .filter((i) => Number(i.stock ?? 1) > 0)
              .map((i) => i._id)
          );
        } else if (isMounted) {
          setCartItems([]);
          setSelectedItemIds([]);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu giỏ hàng:", err);
        if (isMounted) {
          setCartItems([]);
          setSelectedItemIds([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCartData();
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, setCartItems]);

  const checkedItems = items.filter((item) =>
    selectedItemIds.includes(item._id)
  );
  const selectedCount = checkedItems.length;

  const subtotal = checkedItems.reduce(
    (sum, item) => sum + Number(item.new_price || 0) * Number(item.quantity || 1),
    0
  );

  const shippingFee = subtotal >= 1000000 || subtotal === 0 ? 0 : 30000;

  const outOfStockItems = items.filter((i) => Number(i.stock ?? 1) <= 0);
  const hasStockIssue = checkedItems.some(
    (i) =>
      Number(i.stock ?? 99) <= 0 ||
      Number(i.quantity || 1) > Number(i.stock ?? 99)
  );

  // Revalidate applied vouchers when subtotal changes
  useEffect(() => {
    if (subtotal === 0) return;

    if (appliedCoupon) {
      validateVoucherService(
        appliedCoupon.code,
        subtotal,
        checkedItems,
        shippingFee
      )
        .then((res) => {
          if (res?.success && res?.data) {
            setAppliedCoupon(res.data);
            setCouponError("");
          } else {
            setAppliedCoupon(null);
            setCouponError(
              "Mã giảm giá sản phẩm không còn đủ điều kiện với giá trị đơn hiện tại."
            );
            toast.warn(
              "Mã giảm giá sản phẩm đã được gỡ do thay đổi giá trị đơn hàng."
            );
          }
        })
        .catch(() => setAppliedCoupon(null));
    }

    if (appliedShippingCoupon) {
      validateVoucherService(
        appliedShippingCoupon.code,
        subtotal,
        checkedItems,
        shippingFee
      )
        .then((res) => {
          if (res?.success && res?.data) {
            setAppliedShippingCoupon(res.data);
          } else {
            setAppliedShippingCoupon(null);
            toast.warn(
              "Mã miễn phí vận chuyển đã được gỡ do thay đổi giá trị đơn hàng."
            );
          }
        })
        .catch(() => setAppliedShippingCoupon(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const handleToggleSelect = (id) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const inStockItems = items.filter((i) => Number(i.stock ?? 1) > 0);
    if (
      inStockItems.length > 0 &&
      selectedItemIds.length === inStockItems.length
    ) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(inStockItems.map((i) => i._id));
    }
  };

  const handleQuantityChange = async (itemId, newQty) => {
    const item = items.find((i) => i._id === itemId);
    if (!item || newQty < 1) return;

    if (item.stock !== undefined && newQty > Number(item.stock)) {
      toast.error(`Kho chỉ còn tối đa ${item.stock} sản phẩm.`);
      return;
    }

    const oldQty = item.quantity;
    setUpdatingItemId(itemId);

    try {
      const res = await updateCartItemService(itemId, { quantity: newQty });
      if (res?.success && res?.data) {
        const normalized = normalizeCartItems(res.data);
        setCartItems(normalized);

        trackingService.trackCartQuantityChange(
          { id: item.product_id, _id: item.product_id, price: item.price },
          oldQty,
          newQty
        );

        window.dispatchEvent(
          new CustomEvent("cartUpdated", {
            detail: {
              totalQuantity: normalized.reduce((sum, i) => sum + i.quantity, 0),
            },
          })
        );
      }
    } catch (err) {
      console.error("Lỗi cập nhật số lượng:", err);
      toast.error("Cập nhật số lượng thất bại!");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleOpenDeleteModal = (id) => {
    setItemToDeleteId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    const targetItem = items.find((i) => i._id === itemToDeleteId);

    try {
      const res = await deleteCartItemService(itemToDeleteId);
      if (res?.success && res?.data) {
        const normalized = normalizeCartItems(res.data);
        setCartItems(normalized);
        setSelectedItemIds((prev) =>
          prev.filter((id) => id !== itemToDeleteId)
        );
        toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");

        if (targetItem) {
          trackingService.trackRemoveFromCart(
            {
              id: targetItem.product_id,
              _id: targetItem.product_id,
              price: targetItem.price,
            },
            targetItem.quantity
          );
        }

        window.dispatchEvent(
          new CustomEvent("cartUpdated", {
            detail: {
              totalQuantity: normalized.reduce((sum, i) => sum + i.quantity, 0),
            },
          })
        );
      }
    } catch (err) {
      console.error("Lỗi khi xóa sản phẩm:", err);
      toast.error("Xóa sản phẩm thất bại!");
    } finally {
      setDeleteModalOpen(false);
      setItemToDeleteId(null);
    }
  };

  const handleApplyCoupon = async (code) => {
    const uppercaseCode = code.trim().toUpperCase();
    if (
      appliedCoupon?.code === uppercaseCode ||
      appliedShippingCoupon?.code === uppercaseCode
    ) {
      setCouponError("Mã giảm giá này đã được áp dụng.");
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await validateVoucherService(
        uppercaseCode,
        subtotal,
        checkedItems,
        shippingFee
      );
      if (res?.success && res?.data) {
        const isShipping =
          res.data.voucherType === "shipping" ||
          uppercaseCode.includes("SHIP") ||
          res.data.name?.toLowerCase().includes("vận chuyển") ||
          res.data.name?.toLowerCase().includes("ship");
        if (isShipping) {
          setAppliedShippingCoupon(res.data);
          toast.success("Áp dụng mã miễn phí vận chuyển thành công!");
        } else {
          setAppliedCoupon(res.data);
          toast.success("Áp dụng mã giảm giá sản phẩm thành công!");
        }
        setCouponCode("");
      } else {
        setCouponError(res?.message || "Mã giảm giá không hợp lệ.");
      }
    } catch (err) {
      setCouponError(
        err.response?.data?.message || "Mã giảm giá không hợp lệ."
      );
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleCancelCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast.info("Đã hủy áp dụng mã giảm giá sản phẩm.");
  };

  const handleCancelShippingCoupon = () => {
    setAppliedShippingCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast.info("Đã hủy áp dụng mã miễn phí vận chuyển.");
  };

  const activeCoupon = subtotal > 0 ? appliedCoupon : null;
  const activeShippingCoupon = subtotal > 0 ? appliedShippingCoupon : null;

  const discountAmount =
    activeCoupon?.discountAmount || activeCoupon?.discount_amount || 0;
  const shippingDiscount =
    activeShippingCoupon?.discountAmount ||
    activeShippingCoupon?.discount_amount ||
    0;
  const actualShippingDiscount = Math.min(shippingFee, shippingDiscount);
  const finalShippingFee = Math.max(0, shippingFee - actualShippingDiscount);
  const totalDiscount = discountAmount + actualShippingDiscount;
  const grandTotal = Math.max(0, subtotal - discountAmount + finalShippingFee);

  const handleCheckout = () => {
    if (selectedCount === 0) return;
    if (hasStockIssue) {
      toast.error(
        "Vui lòng điều chỉnh số lượng hoặc bỏ chọn sản phẩm hết hàng."
      );
      return;
    }

    trackingService.trackCheckoutStarted(checkedItems, grandTotal);

    navigate("/checkout", {
      state: {
        checkoutItems: checkedItems,
        appliedCoupon: activeCoupon,
        appliedShippingCoupon: activeShippingCoupon,
      },
    });
  };

  const handleAddRecommendedToCart = async (product) => {
    if (!isLoggedIn) {
      toast.info("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      navigate("/login");
      return;
    }
    try {
      const payload = {
        product_id: product._id || product.id,
        variant_id: product.variants?.[0]?._id || null,
        quantity: 1,
        price: product.new_price || 0,
      };

      const res = await addCartItemService(payload);
      if (res?.success) {
        const cartRes = await getCartService();
        const cartId = extractCartId(cartRes);
        if (cartId) {
          const itemsRes = await getCartItemsService(cartId);
          const normalized = normalizeCartItems(itemsRes?.data || []);
          setCartItems(normalized);

          const addedItem = normalized.find(
            (i) => String(i.product_id) === String(payload.product_id)
          );
          if (addedItem && !selectedItemIds.includes(addedItem._id)) {
            setSelectedItemIds((prev) => [...prev, addedItem._id]);
          }

          toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
          trackingService.trackAddToCart(product, 1);

          window.dispatchEvent(
            new CustomEvent("cartUpdated", {
              detail: {
                totalQuantity: normalized.reduce(
                  (sum, i) => sum + i.quantity,
                  0
                ),
              },
            })
          );
        }
      }
    } catch (err) {
      console.error("Lỗi thêm sản phẩm gợi ý:", err);
      toast.error("Thêm vào giỏ hàng thất bại!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <CartSkeleton />
      </div>
    );
  }

  const inStockItemsCount = items.filter(
    (i) => Number(i.stock ?? 1) > 0
  ).length;

  return (
    <div className="min-h-screen bg-background py-8 text-foreground sm:py-12">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        {/* Breadcrumb & Page Header */}
        <div className="mb-8 border-b border-border pb-6">
          <nav
            aria-label="Breadcrumb"
            className="mb-3 flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-muted-foreground"
          >
            <Link to="/" className="hover:text-foreground">
              {siteName}
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground">Giỏ hàng</span>
          </nav>

          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground sm:text-5xl">
              Giỏ hàng của bạn
            </h1>
            <span className="border border-border bg-card px-3.5 py-1 text-xs font-medium tabular-nums tracking-[0.16em] uppercase text-foreground">
              {items.length} thiết kế
            </span>
          </div>
        </div>

        {/* Out-of-stock global banner if any cart items are out of stock */}
        {outOfStockItems.length > 0 && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 border border-destructive/50 bg-destructive/10 p-4 text-xs text-destructive"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold uppercase tracking-[0.14em]">
                Thông báo tồn kho
              </p>
              <p className="mt-1">
                Có {outOfStockItems.length} thiết kế trong giỏ hàng hiện đã hết
                hàng và đã được tự động bỏ chọn khi thanh toán.
              </p>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyCart isLoggedIn={isLoggedIn} />
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Left Column: Selection Bar + Cart Items */}
            <div className="space-y-4 lg:col-span-8">
              <div className="flex items-center justify-between border border-border bg-card px-4 py-3 text-xs">
                <label className="touch-target -my-2 inline-flex cursor-pointer items-center gap-3 select-none">
                  <input
                    type="checkbox"
                    checked={
                      inStockItemsCount > 0 &&
                      selectedItemIds.length === inStockItemsCount
                    }
                    onChange={handleToggleSelectAll}
                    className="h-4 w-4 cursor-pointer border-border accent-foreground"
                  />
                  <span className="font-medium tracking-[0.12em] uppercase text-foreground">
                    Chọn tất cả ({inStockItemsCount} thiết kế khả dụng)
                  </span>
                </label>

                {selectedCount > 0 && (
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    Đã chọn {selectedCount}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <CartItem
                    key={item._id}
                    item={item}
                    selected={selectedItemIds.includes(item._id)}
                    onToggleSelect={handleToggleSelect}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleOpenDeleteModal}
                    isUpdating={updatingItemId === item._id}
                  />
                ))}
              </div>
            </div>

            {/* Right Column: Voucher + Order Summary */}
            <div className="space-y-6 lg:col-span-4">
              <CouponSection
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                appliedCoupon={activeCoupon}
                appliedShippingCoupon={activeShippingCoupon}
                onApplyCoupon={handleApplyCoupon}
                onCancelCoupon={handleCancelCoupon}
                onCancelShippingCoupon={handleCancelShippingCoupon}
                couponError={couponError}
                isValidating={isValidatingCoupon}
              />

              <CartSummary
                subtotal={subtotal}
                discount={totalDiscount}
                shippingFee={finalShippingFee}
                total={grandTotal}
                onCheckout={handleCheckout}
                isCheckingOut={false}
                selectedCount={selectedCount}
                hasStockIssue={hasStockIssue}
              />
            </div>
          </div>
        )}

        {/* Recommended Products */}
        <RecommendedProducts onAddToCart={handleAddRecommendedToCart} />

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-cart-item-title"
          >
            <div className="w-full max-w-md border border-border bg-card p-6 shadow-2xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-destructive/40 bg-destructive/10 text-destructive">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3
                    id="delete-cart-item-title"
                    className="font-serif text-xl text-foreground"
                  >
                    Xác nhận xóa thiết kế
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Thao tác này sẽ gỡ sản phẩm khỏi giỏ hàng của bạn.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="touch-target flex-1 border border-border bg-background text-xs font-semibold tracking-[0.16em] uppercase text-foreground transition-colors hover:bg-secondary"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="touch-target flex-1 bg-destructive text-xs font-semibold tracking-[0.16em] uppercase text-white transition-opacity hover:opacity-90"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
