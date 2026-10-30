import { useEffect, useRef } from "react";
import trackingService from "../services/tracking.service";

// Set lưu trữ các sản phẩm đã được track impression trong phiên duyệt hiện tại để chống spam
const trackedImpressionsInSession = new Set();

/**
 * Hook theo dõi hiển thị sản phẩm (Product Impression) với IntersectionObserver
 * - threshold: 0.5 (xuất hiện tối thiểu 50% trong viewport)
 * - dwellTime: 500ms (phải nhìn thấy tối thiểu 500ms mới tính impression)
 * - session deduplication (chỉ track 1 lần mỗi phiên hoặc trang)
 *
 * @param {Object} product Sản phẩm cần theo dõi
 * @param {Object} options Tùy chọn { threshold, dwellTime, isRecommendation, algorithm, position }
 * @returns {React.RefObject} Ref để gắn vào container của ProductCard
 */
export function useProductImpression(product, options = {}) {
  const elementRef = useRef(null);
  const timerRef = useRef(null);
  const {
    threshold = 0.5,
    dwellTime = 500,
    isRecommendation = false,
    algorithm = "hybrid",
    position = 0,
  } = options;

  useEffect(() => {
    const productId = product?._id || product?.id;
    if (!productId || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const impressionKey = `${productId}_${isRecommendation ? "rec" : "std"}`;
    if (trackedImpressionsInSession.has(impressionKey)) {
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Bắt đầu tính thời gian dừng (dwell time)
            if (!timerRef.current) {
              timerRef.current = setTimeout(() => {
                if (!trackedImpressionsInSession.has(impressionKey)) {
                  trackedImpressionsInSession.add(impressionKey);
                  if (isRecommendation) {
                    trackingService.track("recommendation_impression", {
                      product_id: productId,
                      category_id: product.category_id || product.categoryId,
                      meta: {
                        algorithm,
                        position,
                        name: product.name,
                        price: product.new_price || product.price,
                      },
                    });
                  } else {
                    trackingService.trackProductImpression(product, { position });
                  }
                }
              }, dwellTime);
            }
          } else {
            // Nếu người dùng lướt qua quá nhanh (< dwellTime) -> hủy hẹn giờ
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }
        });
      },
      {
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      observer.disconnect();
    };
  }, [product, threshold, dwellTime, isRecommendation, algorithm, position]);

  return elementRef;
}

export default useProductImpression;
