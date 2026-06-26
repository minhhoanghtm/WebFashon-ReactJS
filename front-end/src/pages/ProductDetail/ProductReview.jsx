import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { getOrdersByUserIdService } from "@/services/order.service";
import { useAuthStore } from "@/store/auth.store";

const ProductReview = ({ reviews = [], productId, averageRating }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [selectedRating, setSelectedRating] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [matchingOrder, setMatchingOrder] = useState(null);
  const [matchingOrderItem, setMatchingOrderItem] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [activeMedia, setActiveMedia] = useState(null);

  const totalReviews = reviews.length;
  const displayAverage =
    totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : averageRating;

  const filteredReviews = useMemo(
    () =>
      selectedRating
        ? reviews.filter((review) => Math.round(review.rating) === selectedRating)
        : reviews,
    [reviews, selectedRating],
  );
  const displayedReviews = showAll ? filteredReviews : filteredReviews.slice(0, 3);

  useEffect(() => {
    let isMounted = true;

    const checkReviewEligibility = async () => {
      if (!isAuthenticated || !user || !productId) return;

      const userId = user._id || user.id;
      const alreadyReviewed = reviews.some((review) => {
        const reviewUserId = review.userId;
        return reviewUserId && String(reviewUserId) === String(userId);
      });

      if (isMounted) setHasReviewed(alreadyReviewed);

      try {
        const orderData = await getOrdersByUserIdService();
        const orders = orderData?.orders || [];
        let foundOrder = null;
        let foundItem = null;

        for (const order of orders) {
          if (order.status !== "delivered") continue;
          const item = order.items?.find((orderItem) => {
            const orderProductId = orderItem.product_id?._id || orderItem.product_id;
            return String(orderProductId) === String(productId);
          });

          if (item) {
            foundOrder = order;
            foundItem = item;
            break;
          }
        }

        if (isMounted) {
          setMatchingOrder(foundOrder);
          setMatchingOrderItem(foundItem);
        }
      } catch (error) {
        console.error("Không thể kiểm tra điều kiện đánh giá:", error);
      }
    };

    checkReviewEligibility();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, productId, reviews, user]);

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((review) => Math.round(review.rating) === stars).length;
    return {
      stars,
      percentage: totalReviews ? Math.round((count / totalReviews) * 100) : 0,
    };
  });

  const handleWriteReview = () => {
    if (!matchingOrder || !matchingOrderItem) return;
    navigate(`/reviews/create?product_id=${productId}&order_id=${matchingOrder._id}`, {
      state: {
        item: matchingOrderItem,
        order: matchingOrder,
      },
    });
  };

  return (
    <section className="product-review" aria-labelledby="product-review-title">
      <div className="product-detail-section-header">
        <div>
          <span>Đánh giá</span>
          <h2 id="product-review-title">Đánh giá khách hàng</h2>
        </div>
        {matchingOrder && !hasReviewed && (
          <button type="button" onClick={handleWriteReview}>
            Viết đánh giá
          </button>
        )}
      </div>

      <div className="product-review__summary">
        <div>
          <strong>{displayAverage.toFixed(1)}</strong>
          <div className="product-review__stars" aria-label={`${displayAverage.toFixed(1)} sao`}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                size={17}
                fill={index < Math.round(displayAverage) ? "currentColor" : "none"}
                aria-hidden="true"
              />
            ))}
          </div>
          <span>Dựa trên {totalReviews} đánh giá</span>
        </div>

        <div className="product-review__bars">
          {ratingDistribution.map(({ stars, percentage }) => (
            <button
              type="button"
              key={stars}
              onClick={() => setSelectedRating(selectedRating === stars ? 0 : stars)}
              className={selectedRating === stars ? "is-active" : ""}
            >
              <span>{stars} sao</span>
              <i>
                <b style={{ width: `${percentage}%` }} />
              </i>
              <em>{percentage}%</em>
            </button>
          ))}
        </div>
      </div>

      <div className="product-review__list">
        {displayedReviews.length ? (
          displayedReviews.map((review) => (
            <article className="product-review-card" key={review.id}>
              <div className="product-review-card__header">
                <div>
                  <strong>{review.author}</strong>
                  <span>{review.date}</span>
                </div>
                <div className="product-review-card__stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={13}
                      fill={index < Math.round(review.rating) ? "currentColor" : "none"}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
              <p>{review.content}</p>
              {((review.images && review.images.length > 0) || (review.videos && review.videos.length > 0)) && (
                <div className="product-review-card__media">
                  {review.images && review.images.map((img, idx) => (
                    <img
                      key={`img-${idx}`}
                      src={img}
                      alt={`Đánh giá bằng hình ảnh ${idx + 1}`}
                      className="product-review-card__image"
                      onClick={() => setActiveMedia({ url: img, type: "image" })}
                      title="Click để xem ảnh phóng to"
                    />
                  ))}
                  {review.videos && review.videos.map((vid, idx) => (
                    <div
                      key={`vid-${idx}`}
                      className="product-review-card__video-wrapper"
                      onClick={() => setActiveMedia({ url: vid, type: "video" })}
                      title="Click để xem video"
                    >
                      <video src={vid} className="product-review-card__video-preview" muted playsInline />
                      <div className="product-review-card__video-overlay">
                        <svg className="play-icon" viewBox="0 0 24 24" width="24" height="24">
                          <polygon points="6 4 20 12 6 20 6 4" fill="white" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))
        ) : (
          <div className="product-review__empty">
            Chưa có đánh giá nào{selectedRating ? ` cho mức ${selectedRating} sao` : ""}.
          </div>
        )}
      </div>

      {filteredReviews.length > 3 && (
        <button
          type="button"
          className="product-review__more"
          onClick={() => setShowAll((current) => !current)}
        >
          {showAll ? "Thu gọn đánh giá" : "Xem thêm đánh giá"}
        </button>
      )}

      {activeMedia && (
        <div
          className="product-review-lightbox"
          onClick={() => setActiveMedia(null)}
          role="dialog"
          aria-label="Xem phương tiện đánh giá"
        >
          <div className="product-review-lightbox__content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="product-review-lightbox__close"
              onClick={() => setActiveMedia(null)}
              aria-label="Đóng"
            >
              &times;
            </button>
            {activeMedia.type === "image" ? (
              <img src={activeMedia.url} alt="Đánh giá bằng hình ảnh" />
            ) : (
              <video src={activeMedia.url} controls autoPlay />
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductReview;
