import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
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

// Sub-components
import OrderFilterTabs from "../../components/order/OrderFilterTabs";
import OrderCard from "../../components/order/OrderCard";
import EmptyOrders from "../../components/order/EmptyOrders";
import OrderHistorySkeleton from "../../components/order/OrderHistorySkeleton";
import OrderDetailModal from "../../components/order/OrderDetailModal";

const UserAccountManagement = ({ isDashboard = false }) => {
  if (!isDashboard) {
    useDocumentTitle("Lịch sử mua hàng");
  }

  const navigate = useNavigate();
  const location = useLocation();

  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";
  const [orders, setOrders] = useState([]);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const status = searchParams.get("status") || "all";
    setSelectedOrderStatus(status);
  }, [searchParams]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRebuying, setIsRebuying] = useState(false);
  const [error, setError] = useState("");

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch user orders on mount
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const ordersData = await getOrdersByUserIdService();
      if (ordersData && ordersData.orders) {
        setOrders(ordersData.orders);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Lấy dữ liệu đơn hàng thất bại. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const { user, isAuthenticated } = useAuthStore();
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());

  // Fetch which products have already been reviewed by the user
  useEffect(() => {
    const fetchReviewStatus = async () => {
      if (orders.length === 0 || !isAuthenticated || !user) {
        setReviewedProductIds(new Set());
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
              console.error(`Failed to fetch reviews for product ${prodId}:`, err);
            }
          })
        );
        setReviewedProductIds(reviewedSet);
      } catch (err) {
        console.error("Error fetching review statuses:", err);
      }
    };

    fetchReviewStatus();
  }, [orders, isAuthenticated, user]);

  // Filter orders based on status tab and search query
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // 1. Status Filter
    if (selectedOrderStatus !== "all") {
      // If active tab is "refunded", map to returned or show empty
      if (selectedOrderStatus === "refunded") {
        result = result.filter((o) => o.status === "refunded" || o.status === "returned");
      } else {
        result = result.filter((o) => o.status === selectedOrderStatus);
      }
    }

    // 2. Search Query Filter (Order ID or Product Name)
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

    // 3. Sort by creation date descending
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
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
        
        // If the cancelled order is currently viewed in detail modal, update it
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
        const totalQty = (itemsRes.data || []).reduce((sum, i) => sum + i.quantity, 0);
        
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

    const itemsToAdd = singleItem ? [singleItem] : (order.items || []);
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
        toast.success(`Đã thêm thành công ${successCount} sản phẩm vào giỏ hàng!`);
        await syncHeaderCart();
      } else {
        toast.error("Thêm sản phẩm vào giỏ hàng thất bại.");
      }
    } catch (error) {
      console.error("Error rebuying items:", error);
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
    <div className={isDashboard ? "relative w-full" : "w-full min-h-screen bg-gray-50/30 pb-20 relative"}>
      {/* Rebuying overlay blocker */}
      {isRebuying && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white px-6 py-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-black" />
            <span className="text-sm font-medium text-gray-700">Đang thêm sản phẩm vào giỏ hàng...</span>
          </div>
        </div>
      )}

      {/* Header and Breadcrumbs */}
      {!isDashboard && (
        <div className="bg-white border-b border-gray-100 py-6">
          <div className="max-w-6xl mx-auto px-4">
            <nav className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <Link to="/" className="hover:text-black transition-colors">Trang chủ</Link>
              <span>/</span>
              <span className="text-gray-500">Tài khoản</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Lịch sử mua hàng</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Lịch sử mua hàng</h1>
            <p className="text-sm text-gray-500 mt-1">Theo dõi và quản lý toàn bộ đơn hàng của bạn.</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <OrderFilterTabs activeTab={selectedOrderStatus} onTabChange={setSelectedOrderStatus} />

      {/* Main Content Area */}
      <div className={isDashboard ? "w-full mt-4" : "max-w-6xl mx-auto px-4 mt-6"}>
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng theo Mã đơn hàng hoặc Tên sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-black transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 mb-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl">
            {error}
          </div>
        )}

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
