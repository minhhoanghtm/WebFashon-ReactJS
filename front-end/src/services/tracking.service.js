import trackingApi from "../api/trackingApi";
import { getAnonymousId } from "../utils/anonymousId";
import sessionService from "./session.service";
import consentService from "./consent.service";
import presenceService from "./presence.service";
import performanceService from "./performance.service";
import { PRESENCE_STATUS } from "../config/activityConfig";

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
  } catch { /* Tracking must not block the UI when storage is unavailable. */ }
  return false;
};

/**
 * Gửi batch sự kiện lên server
 */
const flushBuffer = async (useBeacon = false) => {
  if (!consentService.isTrackingAllowed()) {
    eventBuffer = [];
    return;
  }
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

// Đăng ký listener unload, presence và performance
if (typeof window !== "undefined") {
  ensureTimer();

  // Khởi tạo presence state machine và liên kết callbacks chuyển trạng thái
  presenceService.init({
    onTransition: ({ oldStatus, newStatus, reason, idleDurationSec }) => {
      let eventType = null;
      if (newStatus === PRESENCE_STATUS.IDLE) {
        eventType = "user_became_idle";
      } else if (newStatus === PRESENCE_STATUS.AWAY) {
        eventType = "user_became_away";
      } else if (
        newStatus === PRESENCE_STATUS.ACTIVE &&
        (oldStatus === PRESENCE_STATUS.IDLE || oldStatus === PRESENCE_STATUS.AWAY)
      ) {
        eventType = "user_resumed_activity";
      } else if (newStatus === PRESENCE_STATUS.BACKGROUND) {
        eventType = "page_backgrounded";
      } else if (oldStatus === PRESENCE_STATUS.BACKGROUND && newStatus !== PRESENCE_STATUS.BACKGROUND) {
        eventType = "page_foregrounded";
      } else if (newStatus === PRESENCE_STATUS.SESSION_ENDED) {
        eventType = "session_ended";
      }

      if (eventType) {
        trackingService.track(eventType, {
          meta: {
            fromStatus: oldStatus,
            toStatus: newStatus,
            reason,
            idleDurationSec,
          },
        });
      }
    },
  });

  // Khởi tạo chẩn đoán hiệu năng giao diện UI
  performanceService.init({
    onSignal: (signal) => {
      if (signal.type === "ui_stall_suspected") {
        trackingService.track("ui_stall_suspected", {
          meta: signal,
        });
      } else if (signal.type === "ui_long_task") {
        trackingService.track("ui_long_task", {
          meta: signal,
        });
      } else if (signal.type === "unhandled_error" || signal.type === "unhandled_rejection") {
        trackingService.track("ui_performance_signal", {
          meta: signal,
        });
      }
    },
  });

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

  // Đăng ký lắng nghe thay đổi quyền riêng tư:
  // Nếu người dùng từ chối hoặc rút lại quyền Analytics, lập tức hủy toàn bộ buffer sự kiện
  consentService.subscribe((state) => {
    if (!state?.categories?.analytics || !state?.hasConsented) {
      eventBuffer = [];
      if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = null;
      }
    } else {
      ensureTimer();
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

      // Cập nhật hoạt động cho presence engine (để admin thấy last action)
      if (
        !eventType.startsWith("ui_") &&
        eventType !== "page_view" &&
        eventType !== "session_start" &&
        eventType !== "session_end"
      ) {
        presenceService.reportAction(eventType);
      }

      const sessionCtx = sessionService.getSessionContext();
      const eventItem = {
        event_id: generateUUID(),
        event_type: eventType,
        anonymous_id: getAnonymousId(),
        session_id: sessionId,
        tab_id: sessionService.getTabId(),
        action_id: payload.action_id || sessionService.getCurrentActionId() || null,
        trace_id: payload.trace_id || sessionService.createTraceId(),
        duration_ms:
          typeof payload.duration_ms === "number"
            ? payload.duration_ms
            : typeof payload.durationMs === "number"
            ? payload.durationMs
            : null,
        source: "frontend",
        product_id: payload.product_id || payload.productId || null,
        category_id: payload.category_id || payload.categoryId || null,
        query: payload.query || null,
        meta: payload.meta || {},
        context: {
          ...sessionCtx,
          ...(payload.context || {}),
          fromPath: payload.fromPath || payload.context?.fromPath || sessionCtx.fromPath,
          toPath: payload.toPath || payload.context?.toPath || null,
          navigationType: payload.navigationType || payload.context?.navigationType || null,
          timing: payload.timing || payload.context?.timing || null,
          perf: payload.perf || payload.context?.perf || null,
          api: payload.api || payload.context?.api || null,
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

  trackAddToCartAttempt(product, quantity = 1, variant = {}, extraMeta = {}) {
    if (!product?._id && !product?.id) return;
    this.track("add_to_cart_attempt", {
      product_id: product._id || product.id,
      category_id: product.category_id || product.categoryId,
      meta: {
        quantity,
        price: product.new_price || product.price,
        color: variant?.color,
        size: variant?.size,
        ...extraMeta,
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

  trackAIIntentDetected(intent, confidence = 1, meta = {}) {
    this.track("ai_intent_detected", {
      meta: { intent, confidence, ...meta },
    });
  },

  trackAIToolActionRequested(toolName, actionParams = {}, meta = {}) {
    this.track("ai_tool_action_requested", {
      meta: { toolName, actionParams, ...meta },
    });
  },

  trackAIToolActionConfirmed(toolName, actionId, meta = {}) {
    this.track("ai_tool_action_confirmed", {
      meta: { toolName, actionId, ...meta },
    });
  },

  trackAIToolActionCancelled(toolName, reason = "", meta = {}) {
    this.track("ai_tool_action_cancelled", {
      meta: { toolName, reason, ...meta },
    });
  },

  trackAIToolActionFailed(toolName, error = "", meta = {}) {
    this.track("ai_tool_action_failed", {
      meta: { toolName, error, ...meta },
    });
  },

  trackAICheckoutStarted(orderDraft = {}, meta = {}) {
    this.track("ai_checkout_started", {
      meta: { ...orderDraft, ...meta },
    });
  },

  // -------------------------------------------------------------
  // HELPER METHODS: NAVIGATION LIFECYCLE & DURATION
  // -------------------------------------------------------------
  trackPageEnter(pathname, meta = {}) {
    this.track("page_enter", {
      pathname,
      meta,
    });
  },

  trackPageLeave(pathname, timings = {}, meta = {}) {
    this.track("page_leave", {
      pathname,
      duration_ms: timings.dwellMs || 0,
      context: { timing: timings },
      meta,
    });
  },

  trackRouteChanged(fromPath, toPath, navigationType = "push", meta = {}) {
    this.track("route_changed", {
      fromPath,
      toPath,
      navigationType,
      meta,
    });
  },

  trackNavigationClicked(label, href, meta = {}) {
    this.track("navigation_clicked", {
      meta: { label, href, ...meta },
    });
  },

  // -------------------------------------------------------------
  // HELPER METHODS: EXTENDED PRODUCT & CART
  // -------------------------------------------------------------
  trackProductSizeSelected(product, size, meta = {}) {
    if (!product?._id && !product?.id) return;
    this.track("product_size_selected", {
      product_id: product._id || product.id,
      category_id: product.category_id || product.categoryId,
      meta: { size, ...meta },
    });
  },

  trackProductColorSelected(product, color, meta = {}) {
    if (!product?._id && !product?.id) return;
    this.track("product_color_selected", {
      product_id: product._id || product.id,
      category_id: product.category_id || product.categoryId,
      meta: { color, ...meta },
    });
  },

  trackProductGalleryInteracted(product, imageIndex = 0, meta = {}) {
    if (!product?._id && !product?.id) return;
    this.track("product_gallery_interacted", {
      product_id: product._id || product.id,
      meta: { imageIndex, ...meta },
    });
  },

  trackBuyNowClicked(product, variant = {}, meta = {}) {
    if (!product?._id && !product?.id) return;
    this.track("buy_now_clicked", {
      product_id: product._id || product.id,
      category_id: product.category_id || product.categoryId,
      meta: {
        price: product.new_price || product.price,
        color: variant?.color,
        size: variant?.size,
        ...meta,
      },
    });
  },

  trackCartViewed(cartItems = [], totalPrice = 0, meta = {}) {
    this.track("cart_viewed", {
      meta: {
        itemCount: cartItems.length,
        totalPrice,
        items: cartItems.map((it) => ({
          productId: it.product_id || it.productId || it.id,
          quantity: it.quantity,
          price: it.price,
        })),
        ...meta,
      },
    });
  },

  trackCartItemRemoved(product, meta = {}) {
    if (!product?._id && !product?.id) return;
    this.track("cart_item_removed", {
      product_id: product._id || product.id,
      category_id: product.category_id || product.categoryId,
      meta,
    });
  },

  // -------------------------------------------------------------
  // HELPER METHODS: CHECKOUT & RESERVATION INTEGRATION
  // -------------------------------------------------------------
  trackCheckoutStepViewed(stepNumber, stepName, meta = {}) {
    this.track("checkout_step_viewed", {
      meta: { stepNumber, stepName, ...meta },
    });
  },

  trackShippingStepCompleted(shippingData = {}, meta = {}) {
    this.track("shipping_step_completed", {
      meta: {
        method: shippingData.method,
        fee: shippingData.fee,
        ...meta,
      },
    });
  },

  trackPaymentMethodSelected(paymentMethod, meta = {}) {
    this.track("payment_method_selected", {
      meta: { paymentMethod, ...meta },
    });
  },

  trackReservationCreated(reservationId, expiresAt, meta = {}) {
    this.track("reservation_created", {
      meta: { reservationId, expiresAt, ...meta },
    });
  },

  trackReservationExpired(reservationId, meta = {}) {
    this.track("reservation_expired", {
      meta: { reservationId, ...meta },
    });
  },

  trackReservationCancelled(reservationId, meta = {}) {
    this.track("reservation_cancelled", {
      meta: { reservationId, ...meta },
    });
  },

  trackCheckoutAbandoned(cartItems = [], step = 1, meta = {}) {
    this.track("checkout_abandoned", {
      meta: { step, itemCount: cartItems.length, ...meta },
    });
  },

  // -------------------------------------------------------------
  // HELPER METHODS: SEARCH & DISCOVERY
  // -------------------------------------------------------------
  trackSearchStarted(query, meta = {}) {
    this.track("search_started", {
      query: (query || "").trim().slice(0, 100),
      meta,
    });
  },

  trackFilterApplied(filterType, filterValue, meta = {}) {
    this.track("filter_applied", {
      meta: { filterType, filterValue, ...meta },
    });
  },

  trackSortChanged(sortOption, meta = {}) {
    this.track("sort_changed", {
      meta: { sortOption, ...meta },
    });
  },

  trackCategorySelected(categoryId, categoryName, meta = {}) {
    this.track("category_selected", {
      category_id: categoryId,
      meta: { categoryName, ...meta },
    });
  },

  // -------------------------------------------------------------
  // HELPER METHODS: GENERAL UI ACTIONS
  // -------------------------------------------------------------
  trackButtonClicked(buttonName, meta = {}) {
    this.track("button_clicked", {
      meta: { buttonName, ...meta },
    });
  },

  trackModalOpened(modalName, meta = {}) {
    this.track("modal_opened", {
      meta: { modalName, ...meta },
    });
  },

  trackModalClosed(modalName, meta = {}) {
    this.track("modal_closed", {
      meta: { modalName, ...meta },
    });
  },

  trackTabSelected(tabName, meta = {}) {
    this.track("tab_selected", {
      meta: { tabName, ...meta },
    });
  },

  trackAccordionExpanded(accordionName, meta = {}) {
    this.track("accordion_expanded", {
      meta: { accordionName, ...meta },
    });
  },

  startAction(actionName, meta = {}) {
    return sessionService.startAction(actionName, meta);
  },

  endAction() {
    sessionService.clearAction();
  },
};

if (typeof window !== "undefined") {
  window.trackingService = trackingService;
}

export default trackingService;
