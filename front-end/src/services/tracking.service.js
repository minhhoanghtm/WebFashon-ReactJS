import trackingApi from "../api/trackingApi";
import { getAnonymousId } from "../utils/anonymousId";
import sessionService from "./session.service";
import consentService from "./consent.service";

const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 3000;
const SERVER_ONLY_EVENT_TYPES = [
  "purchase",
  "purchase_completed",
  "order_placed",
  "order_cancelled",
];

let eventBuffer = [];
let flushTimer = null;
let searchDebounceTimer = null;
let lastTrackedSearchQuery = "";
let lastTrackedSearchTime = 0;

const generateUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Lấy role hiện tại từ localStorage để không track admin
 */
const isAdminUser = () => {
  try {
    const authData = localStorage.getItem("auth-storage");
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed?.state?.user?.role === "admin") return true;
    }
  } catch {}
  return false;
};

/**
 * Gửi batch sự kiện lên server
 */
const flushBuffer = async (useBeacon = false) => {
  if (eventBuffer.length === 0) return;

  const eventsToSend = [...eventBuffer];
  eventBuffer = [];

  // 1. Kiểm tra beacon nếu trang đang unload
  if (useBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const apiUrl = (import.meta.env?.VITE_API_BASE_URL || "/api") + "/events";
      const blob = new Blob([JSON.stringify({ events: eventsToSend })], {
        type: "application/json",
      });
      const sent = navigator.sendBeacon(apiUrl, blob);
      if (sent) return;
    } catch {
      // Beacon thất bại fallback sang api
    }
  }

  // 2. Gửi batch qua Axios
  try {
    if (eventsToSend.length === 1) {
      await trackingApi.trackEvent(eventsToSend[0]);
    } else {
      await trackingApi.trackBatchEvents(eventsToSend);
    }
  } catch {
    // Không ném lỗi ra UI, fire-and-forget
  }
};

/**
 * Đảm bảo timer định kỳ hoạt động
 */
const ensureTimer = () => {
  if (!flushTimer && typeof window !== "undefined") {
    flushTimer = setInterval(() => {
      if (eventBuffer.length > 0) {
        flushBuffer();
      }
    }, FLUSH_INTERVAL_MS);
  }
};

// Đăng ký listener unload để flush toàn bộ sự kiện đang chờ
if (typeof window !== "undefined") {
  ensureTimer();

  const handleUnload = () => {
    if (eventBuffer.length > 0) {
      flushBuffer(true);
    }
  };

  window.addEventListener("pagehide", handleUnload);
  window.addEventListener("beforeunload", handleUnload);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      handleUnload();
    }
  });
}

/**
 * Kiểm tra chống trùng sự kiện tìm kiếm
 */
const shouldTrackSearch = (query) => {
  const norm = (query || "").trim().toLowerCase();
  if (!norm) return false;
  const now = Date.now();
  if (norm === lastTrackedSearchQuery && now - lastTrackedSearchTime < 5000) {
    return false;
  }
  lastTrackedSearchQuery = norm;
  lastTrackedSearchTime = now;
  return true;
};

export const trackingService = {
  /**
   * Đưa sự kiện vào buffer hoặc gửi ngay
   */
  track(eventType, payload = {}) {
    try {
      // 1. Chặn sự kiện server-only và admin
      if (SERVER_ONLY_EVENT_TYPES.includes(eventType)) {
        return;
      }
      if (isAdminUser()) {
        return;
      }

      // 2. Kiểm tra quyền riêng tư (consent)
      if (!consentService.isTrackingAllowed()) {
        return;
      }

      // 3. Quản lý phiên và phát hiện session_start
      const { sessionId, isNewSession } = sessionService.getSession();
      if (isNewSession && eventType !== "session_start") {
        this.track("session_start", {
          meta: { trigger: "sliding_window_expired" },
        });
      }

      const eventItem = {
        event_id: generateUUID(),
        event_type: eventType,
        anonymous_id: getAnonymousId(),
        session_id: sessionId,
        source: "frontend",
        product_id: payload.product_id || payload.productId || null,
        category_id: payload.category_id || payload.categoryId || null,
        query: payload.query || null,
        meta: payload.meta || {},
        context: {
          ...sessionService.getSessionContext(),
          ...(payload.context || {}),
        },
        timestamp: new Date().toISOString(),
      };

      eventBuffer.push(eventItem);

      // Nếu buffer đạt kích thước batch -> flush ngay
      if (eventBuffer.length >= BATCH_SIZE) {
        flushBuffer();
      } else {
        ensureTimer();
      }
    } catch {
      // Tuyệt đối không ném ngoại lệ lên giao diện người dùng
    }
  },

  /**
   * Tương thích ngược với interface cũ trackEvent(payload)
   */
  trackEvent(payload = {}) {
    const { event_type, ...rest } = payload;
    if (event_type) {
      this.track(event_type, rest);
    }
  },

  /**
   * Flush ngay lập tức toàn bộ sự kiện trong buffer
   */
  flush() {
    return flushBuffer();
  },

  // -------------------------------------------------------------
  // HELPER METHODS: NAVIGATION & PAGE VIEW
  // -------------------------------------------------------------
  trackPageView(pathname, meta = {}) {
    this.track("page_view", {
      context: { pathname: pathname || window?.location?.pathname },
      meta,
    });
  },

  trackCategoryView(categoryId, categoryName, meta = {}) {
    this.track("category_view", {
      category_id: categoryId,
      meta: { category_name: categoryName, ...meta },
    });
  },

  // -------------------------------------------------------------
  // HELPER METHODS: PRODUCT INTERACTIONS
  // -------------------------------------------------------------
  trackProductImpression(product, meta = {}) {
    if (!product?._id && !product?.id) return;
    this.track("product_impression", {
      product_id: product._id || product.id,
      category_id: product.category_id || product.categoryId,
      meta: {
        name: product.name,
        price: product.new_price || product.price,
        ...meta,
      },
    });
  },

  trackProductView(product, meta = {}) {
    if (!product?._id && !product?.id) return;
    this.track("product_view", {
      product_id: product._id || product.id,
      category_id: product.category_id || product.categoryId,
      meta: {
        name: product.name,
        price: product.new_price || product.price,
        ...meta,
      },
    });
  },

  trackProductClick(product, meta = {}) {
    if (!product?._id && !product?.id) return;
    this.track("product_click", {
      product_id: product._id || product.id,
      category_id: product.category_id || product.categoryId,
      meta: {
        name: product.name,
        price: product.new_price || product.price,
        ...meta,
      },
    });
  },

  trackVariantSelect(product, { color, size }, meta = {}) {
    if (!product?._id && !product?.id) return;
    this.track("product_variant_select", {
      product_id: product._id || product.id,
      category_id: product.category_id || product.categoryId,
      meta: {
        color,
        size,
        ...meta,
      },
    });
  },

  trackProductFavorite(productId, isFavorite = true) {
    if (!productId) return;
    this.track(isFavorite ? "product_favorite" : "product_unfavorite", {
      product_id: productId,
    });
  },

  // -------------------------------------------------------------
  // HELPER METHODS: SEARCH INTERACTIONS
  // -------------------------------------------------------------
  trackSearch(query, resultCount = 0, meta = {}) {
    if (!query || !query.trim()) return;
    const cleanQuery = query.trim();
    if (!shouldTrackSearch(cleanQuery)) return;

    if (resultCount === 0) {
      this.track("search_no_results", {
        query: cleanQuery,
        meta: { resultCount: 0, ...meta },
      });
    } else {
      this.track("search_performed", {
        query: cleanQuery,
        meta: { resultCount, ...meta },
      });
    }
  },

  trackSearchDebounced(query, delay = 800) {
    if (!query || !query.trim()) return;
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      this.trackSearch(query);
    }, delay);
  },

  trackSearchResultClick(productId, query, position = 0) {
    this.track("search_result_click", {
      product_id: productId,
      query,
      meta: { position },
    });
  },

  trackSemanticSearchUsed(query, resultCount = 0) {
    this.track("semantic_search_used", {
      query,
      meta: { resultCount },
    });
  },

  // -------------------------------------------------------------
  // HELPER METHODS: CART & CHECKOUT
  // -------------------------------------------------------------
  trackAddToCart(product, quantity = 1, variant = {}) {
    if (!product?._id && !product?.id) return;
    this.track("add_to_cart", {
      product_id: product._id || product.id,
      category_id: product.category_id || product.categoryId,
      meta: {
        quantity,
        price: product.new_price || product.price,
        color: variant?.color,
        size: variant?.size,
      },
    });
  },

  trackRemoveFromCart(product, quantity = 1) {
    if (!product?._id && !product?.id) return;
    this.track("remove_from_cart", {
      product_id: product._id || product.id,
      category_id: product.category_id || product.categoryId,
      meta: {
        quantity,
        price: product.new_price || product.price,
      },
    });
  },

  trackCartQuantityChange(product, oldQuantity, newQuantity) {
    if (!product?._id && !product?.id) return;
    this.track("cart_quantity_change", {
      product_id: product._id || product.id,
      meta: {
        oldQuantity,
        newQuantity,
        delta: newQuantity - oldQuantity,
      },
    });
  },

  trackCheckoutStarted(cartItems = [], totalPrice = 0) {
    this.track("checkout_started", {
      meta: {
        itemCount: cartItems.length,
        totalPrice,
        items: cartItems.map((it) => ({
          productId: it.product_id || it.productId || it.id,
          quantity: it.quantity,
          price: it.price,
        })),
      },
    });
  },

  // -------------------------------------------------------------
  // HELPER METHODS: AI & RECOMMENDATION
  // -------------------------------------------------------------
  trackRecommendationImpression(products = [], algorithm = "hybrid") {
    if (!products || products.length === 0) return;
    products.forEach((prod, idx) => {
      this.track("recommendation_impression", {
        product_id: prod._id || prod.id,
        category_id: prod.category_id || prod.categoryId,
        meta: {
          algorithm,
          position: idx + 1,
        },
      });
    });
  },

  trackRecommendationClick(product, algorithm = "hybrid", position = 0, extraMeta = {}) {
    if (!product?._id && !product?.id) return;
    this.track("recommendation_clicked", {
      product_id: product._id || product.id,
      category_id: product.category_id || product.categoryId,
      meta: {
        algorithm,
        position,
        ...extraMeta,
      },
    });
  },

  trackAIProductRecommended(product, meta = {}) {
    if (!product?._id && !product?.id) return;
    this.track("ai_product_recommended", {
      product_id: product._id || product.id,
      category_id: product.category_id || product.categoryId,
      meta,
    });
  },

  trackAIRecommendationClick(product, meta = {}) {
    if (!product?._id && !product?.id) return;
    this.track("ai_recommendation_clicked", {
      product_id: product._id || product.id,
      category_id: product.category_id || product.categoryId,
      meta,
    });
  },

  trackAIChatOpened() {
    this.track("ai_chat_opened", {
      meta: { timestamp: new Date().toISOString() },
    });
  },

  trackAIChatInteraction(actionType, meta = {}) {
    this.track(actionType || "ai_product_search", {
      meta,
    });
  },
};

export default trackingService;
