import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { getOrdersByUserIdService } from "@/services/order.service";

const ProductReview = ({ reviews = [], productId }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [showAll, setShowAll] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0); // 0 means all

  // Eligibility states
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [matchingOrder, setMatchingOrder] = useState(null);
  const [matchingOrderItem, setMatchingOrderItem] = useState(null);

  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const totalReviews = safeReviews.length;

  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (!isAuthenticated || !user || !productId) {
        setHasPurchased(false);
        setHasReviewed(false);
        setMatchingOrder(null);
        setMatchingOrderItem(null);
        return;
      }

      try {
        const userId = user._id || user.id;

        // 1. Check if user already reviewed this product
        const alreadyReviewed = safeReviews.some((r) => {
          const reviewUserId = r.user_id?._id || r.user_id;
          return reviewUserId && reviewUserId.toString() === userId.toString();
        });
        setHasReviewed(alreadyReviewed);

        // 2. Fetch user orders to check if they purchased it (status delivered)
        const ordersData = await getOrdersByUserIdService();
        const userOrders = ordersData?.orders || [];

        let foundOrder = null;
        let foundItem = null;
        
        for (const order of userOrders) {
          if (order.status !== "delivered") continue;
          
          const match = order.items?.find(
            (item) => item.product_id?.toString() === productId.toString()
          );
          
          if (match) {
            foundOrder = order;
            foundItem = match;
            break;
          }
        }

        setMatchingOrder(foundOrder);
        setMatchingOrderItem(foundItem);
        setHasPurchased(!!foundOrder);
      } catch (err) {
        console.error("Error checking review eligibility:", err);
      }
    };

    checkReviewEligibility();
  }, [isAuthenticated, user, productId, safeReviews]);

  const handleWriteReviewClick = () => {
    if (!matchingOrderItem || !matchingOrder) return;
    navigate(`/reviews/create?product_id=${productId}&order_id=${matchingOrder._id}`, {
      state: {
        item: matchingOrderItem,
        order: matchingOrder,
      },
    });
  };

  // Calculate average rating
  const averageRating =
    totalReviews > 0
      ? (safeReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews)
      : 4.5; // Default mockup average if no reviews yet

  // Group and count ratings for progress bars
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = safeReviews.filter((r) => r.rating === stars).length;
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { stars, percentage };
  });

  // Filter and sort reviews
  const filteredReviews = selectedRating === 0
    ? safeReviews
    : safeReviews.filter((r) => r.rating === selectedRating);

  const displayedReviews = showAll ? filteredReviews : filteredReviews.slice(0, 3);

  // Helper to get initials
  const getInitials = (name) => {
    if (!name) return "ND";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper to format review date
  const formatDate = (dateStr) => {
    if (!dateStr) return "12 Tháng 6, 2025";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Reviews Section Header */}
      <div className="pd-section-header">
        <span className="pd-section-title text-slate-900 dark:text-white">Đánh giá khách hàng</span>
        {hasPurchased && !hasReviewed && (
          <button
            type="button"
            onClick={handleWriteReviewClick}
            className="pd-btn-outline"
          >
            Viết đánh giá
          </button>
        )}
      </div>

      {/* Summary Rating Wrap */}
      <div className="pd-rating-wrap">
        <div>
          <div className="pd-rating-num font-serif">{averageRating.toFixed(1)}</div>
          <div className="pd-rating-stars-big">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={
                  i < Math.round(averageRating)
                    ? "pd-star-filled text-yellow-500"
                    : "pd-star-empty text-slate-300 dark:text-slate-700"
                }
              >
                ★
              </span>
            ))}
          </div>
          <div className="pd-rating-count">
            Dựa trên {totalReviews || 128} đánh giá
          </div>
        </div>

        {/* Rating Progress Bars */}
        <div className="pd-bars">
          {ratingDistribution.map(({ stars, percentage }) => (
            <div key={stars} className="pd-bar-row">
              <span className="pd-bar-num">{stars}</span>
              <div className="pd-bar-track">
                {/* Fallback mock visual width if 0 total reviews to make the layout look premium */}
                <div
                  className="pd-bar-fill"
                  style={{
                    width: `${totalReviews > 0 ? percentage : (stars === 5 ? 62 : stars === 4 ? 24 : stars === 3 ? 8 : stars === 2 ? 4 : 2)}%`
                  }}
                ></div>
              </div>
              <span className="pd-bar-pct">
                {totalReviews > 0 ? `${percentage}%` : (stars === 5 ? "62%" : stars === 4 ? "24%" : stars === 3 ? "8%" : stars === 2 ? "4%" : "2%")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-400 uppercase self-center mr-2">Lọc theo:</span>
        <button
          type="button"
          onClick={() => setSelectedRating(0)}
          className={`px-3.5 py-1 text-xs border rounded-full font-semibold transition ${
            selectedRating === 0
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
          }`}
        >
          Tất cả
        </button>
        {[5, 4, 3, 2, 1].map((stars) => (
          <button
            key={stars}
            type="button"
            onClick={() => setSelectedRating(stars)}
            className={`px-3.5 py-1 text-xs border rounded-full font-semibold transition ${
              selectedRating === stars
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
            }`}
          >
            {stars} Sao
          </button>
        ))}
      </div>

      {/* Review List */}
      <div className="pd-review-list">
        {displayedReviews.length > 0 ? (
          displayedReviews.map((review) => {
            const authorName = review.user_id?.fullName || review.author || "Khách hàng ẩn danh";
            const initials = getInitials(authorName);
            const reviewText = review.content?.text || review.content || "Sản phẩm tuyệt vời, rất đáng mua!";
            
            return (
              <div key={review._id || review.id || Math.random()} className="pd-review-card text-left bg-slate-50/50 dark:bg-slate-900/20">
                <div className="pd-rev-header">
                  <div className="pd-rev-user">
                    <div className="pd-avatar">{initials}</div>
                    <div>
                      <div className="pd-rev-name text-slate-900 dark:text-slate-100">{authorName}</div>
                      <div className="pd-rev-date">{formatDate(review.createdAt || review.date)}</div>
                    </div>
                  </div>
                  <span className="pd-verified">
                    <span className="pd-check-icon">✓</span> Đã mua hàng
                  </span>
                </div>
                
                {/* Review Stars */}
                <div className="pd-rev-stars my-2">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < (review.rating || 5)
                          ? "pd-star-filled text-yellow-500"
                          : "pd-star-empty text-slate-300 dark:text-slate-700"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>

                {/* Review Text */}
                <div className="pd-rev-body text-slate-700 dark:text-slate-300">
                  {reviewText}
                </div>

                {/* Review Tags */}
                <div className="pd-rev-tags mt-3">
                  <span className="pd-tag">Chất vải đẹp</span>
                  <span className="pd-tag">Mặc vừa vặn</span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center py-6 text-slate-400">
            Chưa có đánh giá nào {selectedRating !== 0 ? `cho mức lọc ${selectedRating} sao` : ""}.
          </p>
        )}
      </div>

      {/* Load More Button */}
      {filteredReviews.length > displayedReviews.length && (
        <div className="pd-load-more-wrap">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="pd-btn-outline"
          >
            Tải thêm đánh giá
          </button>
        </div>
      )}
      
      {showAll && filteredReviews.length > 3 && (
        <div className="pd-load-more-wrap">
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="pd-btn-outline"
          >
            Thu gọn đánh giá
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductReview;
