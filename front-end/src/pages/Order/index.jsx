import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  getOrdersByUserIdService,
  updateOrderService,
} from "@/services/order.service";
import {
  addCartItemService,
  getCartItemsService,
} from "@/services/cartItem.service";
import { getCartService } from "@/services/cart.service";
import { getReviewsByProductIdService } from "@/services/review.service";
import { useAuthStore } from "../../store/auth.store";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Search, X, Loader2 } from "lucide-react";

import OrderFilterTabs from "../../components/order/OrderFilterTabs";
import OrderCard from "../../components/order/OrderCard";
import EmptyOrders from "../../components/order/EmptyOrders";
import OrderHistorySkeleton from "../../components/order/OrderHistorySkeleton";
import OrderDetailModal from "../../components/order/OrderDetailModal";

const UserAccountManagement = ({ isDashboard = false }) => {
  useDocumentTitle("Lịch sử mua hàng");

  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get("status") || "all";
  const [orders, setOrders] = useState([]);
  const [tabState, setTabState] = useState({
    urlStatus,
    active: urlStatus,
  });
  const selectedOrderStatus =
    tabState.urlStatus === urlStatus ? tabState.active : urlStatus;

  const handleTabChange = (nextStatus) => {
    setTabState({ urlStatus, active: nextStatus });
  };

  const [searchQuery, setSearchQuery] = useState("");

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRebuying, setIsRebuying] = useState(false);
  const [error, setError] = useState("");

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch user orders on mount
  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        const ordersData = await getOrdersByUserIdService();
        if (isMounted && ordersData && ordersData.orders) {
          setOrders(ordersData.orders);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        if (isMounted) {
          setError("Lấy dữ liệu đơn hàng thất bại. Vui lòng thử lại sau.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const { user, isAuthenticated } = useAuthStore();
  const [reviewedProductIds, setReviewedProductIds] = useState(() => new Set());

  // Fetch which products have already been reviewed by the user
  useEffect(() => {
    let isMounted = true;
    const fetchReviewStatus = async () => {
      if (orders.length === 0 || !isAuthenticated || !user) {
        return;
      }

      const userId = user._id || user.id;
      if (!userId) return;

      const deliveredProductIds = new Set();
      orders.forEach((order) => {
        if (order.status === "delivered") {
          order.items?.forEach((item) => {
            if (item.product_id) {
              deliveredProductIds.add(item.product_id.toString());
            }
          });
        }
      });

      if (deliveredProductIds.size === 0) return;

      try {
        const reviewedSet = new Set();
        await Promise.all(
          Array.from(deliveredProductIds).map(async (prodId) => {
            try {
              const reviews = await getReviewsByProductIdService(prodId);
              const hasUserReview = reviews.some((r) => {
                const rUserId = r.user_id?._id || r.user_id;
                return rUserId && rUserId.toString() === userId.toString();
              });
              if (hasUserReview) {
                reviewedSet.add(prodId);
              }
            } catch (err) {
              console.error(
                `Failed to fetch reviews for product ${prodId}:`,
                err
              );
            }
          })
        );
        if (isMounted) {
          setReviewedProductIds(reviewedSet);
        }
      } catch (err) {
        console.error("Error fetching review statuses:", err);
      }
    };

    fetchReviewStatus();
    return () => {
      isMounted = false;
    };
  }, [orders, isAuthenticated, user]);

  // Filter orders based on status tab and search query
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (selectedOrderStatus !== "all") {
      if (selectedOrderStatus === "refunded") {
        result = result.filter(
          (o) => o.status === "refunded" || o.status === "returned"
        );
      } else {
        result = result.filter((o) => o.status === selectedOrderStatus);
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        const matchesId = o._id?.toLowerCase().includes(query);
        const matchesProduct = o.items?.some((item) =>
          item.product_name?.toLowerCase().includes(query)
        );
        return matchesId || matchesProduct;
      });
    }

    return result.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [orders, selectedOrderStatus, searchQuery]);

  // Handle Order Cancellation
  const handleCancelOrder = async (orderId) => {
    const result = await Swal.fire({
      title: "Xác nhận hủy đơn hàng?",
      text: "Bạn có chắc chắn muốn hủy đơn hàng này? Thao tác này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hủy đơn hàng",
      cancelButtonText: "Đóng",
      confirmButtonColor: "#111111",
      cancelButtonColor: "#737373",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await updateOrderService(orderId, {
        status: "cancelled",
      });

      if (res.success || res.status === "cancelled") {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: "cancelled" } : o
          )
        );

        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, status: "cancelled" }));
        }

        toast.success("Hủy đơn hàng thành công");
      } else {
        toast.error("Hủy đơn thất bại");
      }
    } catch (err) {
      console.error("Error cancelling order:", err);
      toast.error("Hủy đơn hàng thất bại");
    }
  };

  // Sync cart item count in Header after modifications
  const syncHeaderCart = async () => {
    try {
      const cartRes = await getCartService();
      if (cartRes.success && cartRes.data?.length > 0) {
        const cartId = cartRes.data[0]._id;
        const itemsRes = await getCartItemsService(cartId);
        const totalQty = (itemsRes.data || []).reduce(
          (sum, i) => sum + i.quantity,
          0
        );

        window.dispatchEvent(
          new CustomEvent("cartUpdated", {
            detail: {
              totalQuantity: totalQty,
            },
          })
        );
      }
    } catch (err) {
      console.error("Failed to sync header cart quantity:", err);
    }
  };

  // Rebuy items handler (Single product or entire order)
  const handleRebuy = async (order, singleItem = null) => {
    const role = user?.role || user?.data?.role || "";
    if (role === "admin") {
      toast.error("Quản trị viên không thể thực hiện chức năng mua hàng!");
      return;
    }

    const itemsToAdd = singleItem ? [singleItem] : order.items || [];
    if (itemsToAdd.length === 0) return;

    setIsRebuying(true);
    let successCount = 0;
    try {
      for (const item of itemsToAdd) {
        const payload = {
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity || 1,
          price: item.price || 0,
        };
        const res = await addCartItemService(payload);
        if (res.success) {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `Đã thêm thành công ${successCount} sản phẩm vào giỏ hàng!`
        );
        await syncHeaderCart();
      } else {
        toast.error("Thêm sản phẩm vào giỏ hàng thất bại.");
      }
    } catch (err) {
      console.error("Error rebuying items:", err);
      toast.error("Có lỗi xảy ra khi thực hiện mua lại sản phẩm.");
    } finally {
      setIsRebuying(false);
    }
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return <OrderHistorySkeleton />;
  }

  return (
    <div
      className={
        isDashboard
          ? "relative w-full text-[var(--color-text)]"
          : "w-full min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] pb-20 relative"
      }
    >
      {/* Rebuying overlay blocker */}
      {isRebuying && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <div className="bg-[var(--color-surface)] px-6 py-4 border border-[var(--color-border)] flex items-center gap-3">
            <Loader2
              className="w-5 h-5 animate-spin text-[var(--color-text)]"
              aria-hidden="true"
            />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">
              Đang cập nhật lại vào giỏ hàng...
            </span>
          </div>
        </div>
      )}

      {/* Header and Breadcrumbs */}
      {!isDashboard && (
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)] mb-3"
            >
              <Link
                to="/"
                className="hover:text-[var(--color-text)] transition-colors"
              >
                Trang chủ
              </Link>
              <span>/</span>
              <Link
                to="/profile"
                className="hover:text-[var(--color-text)] transition-colors"
              >
                Tài khoản
              </Link>
              <span>/</span>
              <span className="text-[var(--color-text)] font-medium">
                Đơn hàng
              </span>
            </nav>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              Đơn hàng của bạn
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-2">
              Theo dõi trạng thái xử lý, vận chuyển và lịch sử giao nhận đơn
              hàng.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <OrderFilterTabs
        activeTab={selectedOrderStatus}
        onTabChange={handleTabChange}
      />

      {/* Main Content Area */}
      <div
        className={
          isDashboard
            ? "w-full mt-4"
            : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6"
        }
      >
        {/* Search Bar */}
        <div className="relative mb-6">
          <label htmlFor="order-search-input" className="sr-only">
            Tìm kiếm theo mã đơn hàng hoặc tên sản phẩm
          </label>
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search
              className="h-4 w-4 text-[var(--color-text-muted)]"
              aria-hidden="true"
            />
          </div>
          <input
            id="order-search-input"
            type="text"
            placeholder="Tìm kiếm theo mã đơn hàng hoặc tên sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full min-h-[44px] pl-10 pr-11 py-2.5 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text)] text-sm transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute inset-y-0 right-0 min-w-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div aria-live="polite" aria-atomic="true">
          {error && (
            <div
              role="alert"
              className="p-4 mb-6 text-xs font-medium text-[var(--color-danger)] border border-[var(--color-danger)] bg-[var(--color-surface)]"
            >
              {error}
            </div>
          )}
        </div>

        {/* Order Cards List or Empty State */}
        {filteredOrders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                reviewedProductIds={reviewedProductIds}
                onViewDetail={handleViewDetail}
                onCancel={handleCancelOrder}
                onRebuy={handleRebuy}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Modal overlay */}
      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
};

export default UserAccountManagement;
