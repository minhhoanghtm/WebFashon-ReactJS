import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { useCartStore } from "../../store/cart.store";
import { getCartService } from "@/services/cart.service";
import {
  getCartItemsService,
  updateCartItemService,
  deleteCartItemService,
  addCartItemService,
} from "@/services/cartItem.service";
import { validateVoucherService } from "@/services/voucher.service";
import trackingService from "@/services/tracking.service";
import { toast } from "react-toastify";
import { AlertCircle, CheckCircle, Trash2, X } from "lucide-react";

// Sub-components
import CartItem from "../../components/cart/CartItem";
import CartSummary from "../../components/cart/CartSummary";
import CouponSection from "../../components/cart/CouponSection";
import EmptyCart from "../../components/cart/EmptyCart";
import CartSkeleton from "../../components/cart/CartSkeleton";
import RecommendedProducts from "../../components/cart/RecommendedProducts";

// Normalizes backend CartItem schema structures to client-compatible store formats
const normalizeCartItems = (backendItems) => {
  return backendItems.map((item) => {
    if (item.name) return item; // Already mapped

    const product = item.product_id || {};
    const variant = item.variant_id || {};

    const displayImage = Array.isArray(product.displayProduct)
      ? product.displayProduct.find(Boolean)
      : product.displayProduct;

    const normalizeImageUrl = (url) => {
      if (!url) return "";
      if (url.includes("example.com")) return "";
      if (url.includes("webfashon-reactjs.onrender.com")) {
        const localOrigin = "http://localhost:5000";
        return url.replace(/https?:\/\/webfashon-reactjs\.onrender\.com/, localOrigin);
      }
      return url;
    };

    const variantImage = normalizeImageUrl(variant.image_url);
    const productImage = normalizeImageUrl(displayImage || product.image || product.imageUrl || product.image_url || "");

    return {
      _id: item._id, // cartItem ID
      product_id: product._id || product.id,
      name: product.name || "Sản phẩm thời trang",
      category: product.category_id?.name || "Quần áo",
      image: variantImage || productImage || "",
      productImage: productImage,
      new_price: product.new_price || item.price || 0,
      old_price: product.old_price || 0,
      price: item.price || product.new_price || 0,
      quantity: item.quantity || 1,
      stock: variant.stock ?? product.stock ?? 99,
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

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated: isLoggedIn, user } = useAuthStore();
  const { items, setCartItems } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  useEffect(() => {
    const role = user?.role || user?.data?.role || "";
    if (role === "admin") {
      toast.error("Quản trị viên không thể thực hiện chức năng mua hàng!");
      navigate("/");
    }
  }, [user, navigate]);
  
  // Voucher / Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [appliedShippingCoupon, setAppliedShippingCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState(null);

  // Fetch cart details from backend database on mount
  useEffect(() => {
    const fetchCartData = async () => {
      if (!isLoggedIn) {
        setCartItems([]);
        setSelectedItemIds([]);
        return;
      }
      try {
        setLoading(true);
        const cartRes = await getCartService();
        const cartData = cartRes.data;
        if (cartRes.success && cartData && cartData._id) {
          const cartId = cartData._id;
          const itemsRes = await getCartItemsService(cartId);
          const normalized = normalizeCartItems(itemsRes.data || []);
          
          setCartItems(normalized);
          // By default, select all valid/in-stock items
          setSelectedItemIds(
            normalized.filter((i) => (i.stock ?? 1) > 0).map((i) => i._id)
          );
        } else {
          setCartItems([]);
          setSelectedItemIds([]);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu giỏ hàng:", err);
        setCartItems([]);
        setSelectedItemIds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCartData();
  }, [isLoggedIn, setCartItems]);

  // Derived check/selection state
  const checkedItems = items.filter((item) => selectedItemIds.includes(item._id));
  const selectedCount = checkedItems.length;

  // Dynamically calculate subtotal fromchecked items
  const subtotal = checkedItems.reduce(
    (sum, item) => sum + item.new_price * item.quantity,
    0
  );

  // Dynamic Shipping Fee (Standard fee is 30,000đ, free if subtotal >= 1,000,000đ)
  const shippingFee = subtotal >= 1000000 || subtotal === 0 ? 0 : 30000;

  // Validate coupon automatically against subtotal when checked items or quantities change
  useEffect(() => {
    if (subtotal === 0) {
      setAppliedCoupon(null);
      setAppliedShippingCoupon(null);
      return;
    }

    if (appliedCoupon) {
      const revalidateCoupon = async () => {
        try {
          const res = await validateVoucherService(appliedCoupon.code, subtotal, checkedItems, shippingFee);
          if (res.success && res.data) {
            setAppliedCoupon(res.data);
            setCouponError("");
          } else {
            setAppliedCoupon(null);
            setCouponError("Mã giảm giá sản phẩm không khả dụng cho giá trị đơn hàng này");
            toast.warn("Mã giảm giá sản phẩm đã bị gỡ bỏ do thay đổi giá trị đơn hàng.");
          }
        } catch {
          setAppliedCoupon(null);
        }
      };
      revalidateCoupon();
    }

    if (appliedShippingCoupon) {
      const revalidateShippingCoupon = async () => {
        try {
          const res = await validateVoucherService(appliedShippingCoupon.code, subtotal, checkedItems, shippingFee);
          if (res.success && res.data) {
            setAppliedShippingCoupon(res.data);
          } else {
            setAppliedShippingCoupon(null);
            toast.warn("Mã miễn phí vận chuyển đã bị gỡ bỏ do thay đổi giá trị đơn hàng.");
          }
        } catch {
          setAppliedShippingCoupon(null);
        }
      };
      revalidateShippingCoupon();
    }
  }, [subtotal]);

  // Checklist Selection Handlers
  const handleToggleSelect = (id) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const inStockItems = items.filter((i) => (i.stock ?? 1) > 0);
    if (selectedItemIds.length === inStockItems.length) {
      setSelectedItemIds([]); // Uncheck all
    } else {
      setSelectedItemIds(inStockItems.map((i) => i._id)); // Check all
    }
  };

  // Quantity updates handler synced with backend
  const handleQuantityChange = async (itemId, newQty) => {
    const item = items.find((i) => i._id === itemId);
    if (!item) return;

    if (newQty < 1) return;
    if (item.stock !== undefined && newQty > item.stock) {
      toast.error(`Chỉ còn tối đa ${item.stock} sản phẩm trong kho`);
      return;
    }

    const oldQty = item.quantity;

    try {
      const res = await updateCartItemService(itemId, { quantity: newQty });
      if (res.success && res.data) {
        const normalized = normalizeCartItems(res.data);
        setCartItems(normalized);

        // Ghi nhận sự kiện thay đổi số lượng giỏ hàng
        trackingService.trackCartQuantityChange(
          { id: item.product_id, _id: item.product_id, price: item.price },
          oldQty,
          newQty
        );
        
        // Notify other elements (like headers)
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
    }
  };

  // Remove / Delete handlers
  const handleOpenDeleteModal = (id) => {
    setItemToDeleteId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;

    const targetItem = items.find((i) => i._id === itemToDeleteId);

    try {
      const res = await deleteCartItemService(itemToDeleteId);
      if (res.success && res.data) {
        const normalized = normalizeCartItems(res.data);
        setCartItems(normalized);
        setSelectedItemIds((prev) => prev.filter((id) => id !== itemToDeleteId));
        toast.success("Đã xóa sản phẩm khỏi giỏ hàng!");

        // Ghi nhận sự kiện xóa sản phẩm khỏi giỏ hàng
        if (targetItem) {
          trackingService.trackRemoveFromCart(
            { id: targetItem.product_id, _id: targetItem.product_id, price: targetItem.price },
            targetItem.quantity
          );
        }

        // Notify headers
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

  // Apply Coupon code
  const handleApplyCoupon = async (code) => {
    const uppercaseCode = code.trim().toUpperCase();
    if (appliedCoupon?.code === uppercaseCode || appliedShippingCoupon?.code === uppercaseCode) {
      setCouponError("Mã giảm giá này đã được áp dụng");
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await validateVoucherService(uppercaseCode, subtotal, checkedItems, shippingFee);
      if (res.success && res.data) {
        const isShipping = res.data.voucherType === "shipping" || uppercaseCode.includes("SHIP") || res.data.name?.toLowerCase().includes("vận chuyển") || res.data.name?.toLowerCase().includes("ship");
        if (isShipping) {
          setAppliedShippingCoupon(res.data);
          toast.success("Áp dụng mã miễn phí vận chuyển thành công!");
        } else {
          setAppliedCoupon(res.data);
          toast.success("Áp dụng mã giảm giá sản phẩm thành công!");
        }
        setCouponCode("");
      } else {
        setCouponError(res.message || "Mã giảm giá không hợp lệ");
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || "Mã giảm giá không hợp lệ");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleCancelCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast.info("Đã hủy áp dụng mã giảm giá sản phẩm");
  };

  const handleCancelShippingCoupon = () => {
    setAppliedShippingCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast.info("Đã hủy áp dụng mã miễn phí vận chuyển");
  };

  // Checkout redirect handler
  const handleCheckout = () => {
    if (selectedCount === 0) return;

    // Ghi nhận sự kiện checkout_started
    trackingService.trackCheckoutStarted(checkedItems, finalTotal);
    
    // Pass checked items and applied vouchers to Checkout state
    navigate("/checkout", {
      state: {
        checkoutItems: checkedItems,
        appliedCoupon,
        appliedShippingCoupon
      }
    });
  };

  // Add Recommended product to Cart
  const handleAddRecommendedToCart = async (product) => {
    try {
      const payload = {
        product_id: product._id || product.id,
        variant_id: product.variants?.[0]?._id || null,
        quantity: 1,
        price: product.new_price || 0,
      };

      const res = await addCartItemService(payload);
      if (res.success) {
        // Fetch cart items again to populate the store correctly
        const cartRes = await getCartService();
        if (cartRes.success && cartRes.data?.length > 0) {
          const cartId = cartRes.data[0]._id;
          const itemsRes = await getCartItemsService(cartId);
          const normalized = normalizeCartItems(itemsRes.data || []);
          setCartItems(normalized);
          
          // Add newly added item to checked selection
          const addedItem = normalized.find((i) => i.product_id === payload.product_id);
          if (addedItem && !selectedItemIds.includes(addedItem._id)) {
            setSelectedItemIds((prev) => [...prev, addedItem._id]);
          }

          toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
          
          // Ghi nhận sự kiện add_to_cart khi thêm thành công vào giỏ hàng
          trackingService.trackAddToCart(product, 1);
          
          // Notify headers
          window.dispatchEvent(
            new CustomEvent("cartUpdated", {
              detail: {
                totalQuantity: normalized.reduce((sum, i) => sum + i.quantity, 0),
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

  const discountAmount = appliedCoupon?.discountAmount || appliedCoupon?.discount_amount || 0;
  const shippingDiscount = appliedShippingCoupon?.discountAmount || appliedShippingCoupon?.discount_amount || 0;
  const actualShippingDiscount = Math.min(shippingFee, shippingDiscount);
  const finalShippingFee = Math.max(0, shippingFee - actualShippingDiscount);
  const totalDiscount = discountAmount + actualShippingDiscount;
  const grandTotal = Math.max(0, subtotal - discountAmount + finalShippingFee);

  if (loading) {
    return <CartSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] py-8 select-none">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header breadcrumbs */}
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6B716E] border-b border-[#05251C]/10 pb-4">
          <Link to="/" className="hover:text-[#05251C] transition">404STUDIO</Link>
          <span>/</span>
          <span className="text-[#05251C] font-black">YOUR BAG</span>
        </div>

        <div className="text-left flex items-baseline justify-between">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#05251C] flex items-baseline gap-3 font-display uppercase leading-[0.95]">
            <span>YOUR BAG.</span>
            <span className="text-xs font-bold text-[#05251C] bg-[#F5DD20] px-3 py-1 rounded-full tabular-nums">
              {items.length} món
            </span>
          </h1>
        </div>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid lg:grid-cols-12 lg:gap-x-10 items-start mt-6 gap-y-8">
            {/* Left Column: Selection controls + Cart items list */}
            <div className="lg:col-span-8 space-y-4">
              {/* Checked selection header panel */}
              <div className="flex items-center justify-between bg-white border border-[#E8E5DF] rounded-2xl p-4 text-xs font-semibold text-neutral-700 shadow-2xs">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={
                      items.filter((i) => (i.stock ?? 1) > 0).length > 0 &&
                      selectedItemIds.length === items.filter((i) => (i.stock ?? 1) > 0).length
                    }
                    onChange={handleToggleSelectAll}
                    className="h-4.5 w-4.5 rounded border-neutral-300 accent-[#05251C] cursor-pointer"
                  />
                  <span>Chọn tất cả ({items.length} sản phẩm)</span>
                </label>

                {selectedCount > 0 && (
                  <span className="text-xs font-bold text-[#05251C]">
                    Đã chọn {selectedCount} sản phẩm
                  </span>
                )}
              </div>

            {/* List of Cart Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item._id}
                  item={item}
                  selected={selectedItemIds.includes(item._id)}
                  onToggleSelect={handleToggleSelect}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleOpenDeleteModal}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Vouchers & Cart Summary */}
          <div className="lg:col-span-4 space-y-6">
            {/* Coupon Application Block */}
            <CouponSection
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              appliedCoupon={appliedCoupon}
              appliedShippingCoupon={appliedShippingCoupon}
              onApplyCoupon={handleApplyCoupon}
              onCancelCoupon={handleCancelCoupon}
              onCancelShippingCoupon={handleCancelShippingCoupon}
              couponError={couponError}
              isValidating={isValidatingCoupon}
            />

            {/* Sticky Order Summary Card */}
            <CartSummary
              subtotal={subtotal}
              discount={totalDiscount}
              shippingFee={finalShippingFee}
              total={grandTotal}
              onCheckout={handleCheckout}
              isCheckingOut={false}
              selectedCount={selectedCount}
            />
          </div>
        </div>
      )}

      {/* Recommended products grid */}
      <RecommendedProducts onAddToCart={handleAddRecommendedToCart} />

      {/* Deletion Confirmation Custom Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 text-center">
            {/* Warning indicator */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
              <Trash2 className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Xác nhận xóa sản phẩm</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng? Hành động này không thể hoàn tác.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl shadow-md transition cursor-pointer"
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
