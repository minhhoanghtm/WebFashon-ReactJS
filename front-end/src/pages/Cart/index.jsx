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
import { toast } from "react-toastify";
import { AlertCircle, CheckCircle, Trash2, X } from "lucide-react";

// Sub-components
import CartItem from "../../components/cart/CartItem";
import CartSummary from "../../components/cart/CartSummary";
import CouponSection from "../../components/cart/CouponSection";
import EmptyCart from "../../components/cart/EmptyCart";
import CartSkeleton from "../../components/cart/CartSkeleton";
import RecommendedProducts from "../../components/cart/RecommendedProducts";

const DEMO_CART_ITEMS = [
  {
    _id: "demo-cart-1",
    product_id: "demo-product-1",
    name: "Áo thun basic form rộng",
    category: "Áo nam",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=60",
    new_price: 249000,
    old_price: 329000,
    price: 249000,
    quantity: 2,
    stock: 12,
    variants: [
      {
        _id: "demo-variant-1",
        color: "Trắng",
        size: "M",
        image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=60",
        stock: 12,
      },
    ],
  },
  {
    _id: "demo-cart-2",
    product_id: "demo-product-2",
    name: "Quần jeans slim fit",
    category: "Quần nam",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&auto=format&fit=crop&q=60",
    new_price: 419000,
    old_price: 549000,
    price: 419000,
    quantity: 1,
    stock: 5,
    variants: [
      {
        _id: "demo-variant-2",
        color: "Xanh đậm",
        size: "32",
        image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&auto=format&fit=crop&q=60",
        stock: 5,
      },
    ],
  },
  {
    _id: "demo-cart-3",
    product_id: "demo-product-3",
    name: "Giày sneaker trắng",
    category: "Giày dép",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&auto=format&fit=crop&q=60",
    new_price: 690000,
    old_price: 850000,
    price: 690000,
    quantity: 1,
    stock: 3,
    variants: [
      {
        _id: "demo-variant-3",
        color: "Trắng",
        size: "42",
        image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&auto=format&fit=crop&q=60",
        stock: 3,
      },
    ],
  },
];

// Normalizes backend CartItem schema structures to client-compatible store formats
const normalizeCartItems = (backendItems) => {
  return backendItems.map((item) => {
    if (item.name) return item; // Already mapped

    const product = item.product_id || {};
    const variant = item.variant_id || {};

    return {
      _id: item._id, // cartItem ID
      product_id: product._id || product.id,
      name: product.name || "Sản phẩm thời trang",
      category: product.category_id?.name || "Quần áo",
      image: variant.image_url || product.image || "",
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
  const { isAuthenticated: isLoggedIn } = useAuthStore();
  const { items, setCartItems } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Voucher / Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState(null);

  // Fetch cart details from backend database on mount
  useEffect(() => {
    const fetchCartData = async () => {
      if (!isLoggedIn) {
        setIsDemoMode(true);
        setCartItems(DEMO_CART_ITEMS);
        setSelectedItemIds(DEMO_CART_ITEMS.map((item) => item._id));
        return;
      }
      try {
        setLoading(true);
        const cartRes = await getCartService();
        if (cartRes.success && cartRes.data?.length > 0) {
          setIsDemoMode(false);
          const cartId = cartRes.data[0]._id;
          const itemsRes = await getCartItemsService(cartId);
          const normalized = normalizeCartItems(itemsRes.data || []);
          
          setCartItems(normalized);
          // By default, select all valid/in-stock items
          setSelectedItemIds(
            normalized.filter((i) => (i.stock ?? 1) > 0).map((i) => i._id)
          );
        } else {
          setIsDemoMode(true);
          setCartItems(DEMO_CART_ITEMS);
          setSelectedItemIds(DEMO_CART_ITEMS.map((item) => item._id));
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu giỏ hàng:", err);
        setIsDemoMode(true);
        setCartItems(DEMO_CART_ITEMS);
        setSelectedItemIds(DEMO_CART_ITEMS.map((item) => item._id));
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
    if (appliedCoupon && subtotal > 0) {
      const revalidateCoupon = async () => {
        try {
          const res = await validateVoucherService(appliedCoupon.code, subtotal);
          if (res.success && res.data) {
            setAppliedCoupon(res.data);
            setCouponError("");
          } else {
            setAppliedCoupon(null);
            setCouponError("Mã giảm giá không khả dụng cho giá trị đơn hàng này");
            toast.warn("Mã giảm giá đã bị gỡ bỏ do thay đổi giá trị đơn hàng.");
          }
        } catch (err) {
          setAppliedCoupon(null);
        }
      };
      revalidateCoupon();
    } else if (subtotal === 0) {
      setAppliedCoupon(null);
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

    if (isDemoMode) {
      setCartItems(
        items.map((currentItem) =>
          currentItem._id === itemId ? { ...currentItem, quantity: newQty } : currentItem
        )
      );
      return;
    }

    try {
      const res = await updateCartItemService(itemId, { quantity: newQty });
      if (res.success && res.data) {
        const normalized = normalizeCartItems(res.data);
        setCartItems(normalized);
        
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

    if (isDemoMode) {
      const updatedItems = items.filter((item) => item._id !== itemToDeleteId);
      setCartItems(updatedItems);
      setSelectedItemIds((prev) => prev.filter((id) => id !== itemToDeleteId));
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng!");
      setDeleteModalOpen(false);
      setItemToDeleteId(null);
      return;
    }

    try {
      const res = await deleteCartItemService(itemToDeleteId);
      if (res.success && res.data) {
        const normalized = normalizeCartItems(res.data);
        setCartItems(normalized);
        setSelectedItemIds((prev) => prev.filter((id) => id !== itemToDeleteId));
        toast.success("Đã xóa sản phẩm khỏi giỏ hàng!");

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
    setIsValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await validateVoucherService(code, subtotal);
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        toast.success("Áp dụng mã giảm giá thành công!");
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
    toast.info("Đã hủy áp dụng mã giảm giá");
  };

  // Checkout redirect handler
  const handleCheckout = () => {
    if (selectedCount === 0) return;
    
    // Pass only the checked items to Checkout state
    navigate("/checkout", { state: { checkoutItems: checkedItems } });
  };

  // Add Recommended product to Cart
  const handleAddRecommendedToCart = async (product) => {
    if (isDemoMode) {
      toast.info("Đây là dữ liệu mẫu, vui lòng đăng nhập để thêm sản phẩm thật.");
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

  const discountAmount = appliedCoupon?.discount_amount || 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  if (loading) {
    return <CartSkeleton />;
  }

  return (
    <div className="max-w-325 mx-auto px-6 py-12 space-y-8 min-h-screen">
      {/* Header breadcrumbs */}
      <div className="pd-breadcrumb text-left">
        Trang chủ <span>›</span> Giỏ hàng <span>›</span> Chi tiết giỏ hàng
      </div>

      <div className="text-left">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-baseline gap-2">
          <span>Giỏ hàng của bạn</span>
          <span className="text-sm font-medium text-slate-400">
            ({items.length} sản phẩm)
          </span>
        </h2>
      </div>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid lg:grid-cols-12 lg:gap-x-12 items-start mt-8 gap-y-8">
          {/* Left Column: Selection controls + Cart items list */}
          <div className="lg:col-span-8 space-y-4">
            {/* Checked selection header panel */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 rounded-xl p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    items.filter((i) => (i.stock ?? 1) > 0).length > 0 &&
                    selectedItemIds.length === items.filter((i) => (i.stock ?? 1) > 0).length
                  }
                  onChange={handleToggleSelectAll}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Chọn tất cả ({items.length} sản phẩm)</span>
              </label>

              {selectedCount > 0 && (
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  Đã chọn {selectedCount} sản phẩm để thanh toán
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
              onApplyCoupon={handleApplyCoupon}
              onCancelCoupon={handleCancelCoupon}
              couponError={couponError}
              isValidating={isValidatingCoupon}
            />

            {/* Sticky Order Summary Card */}
            <CartSummary
              subtotal={subtotal}
              discount={discountAmount}
              shippingFee={shippingFee}
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
  );
};

export default Cart;
