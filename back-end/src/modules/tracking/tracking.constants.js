export const EVENT_TYPES = {
  // Navigation
  PAGE_VIEW: "page_view",
  SESSION_START: "session_start",
  SESSION_END: "session_end",
  CATEGORY_VIEW: "category_view",

  // Product Interaction
  PRODUCT_IMPRESSION: "product_impression",
  PRODUCT_VIEW: "product_view",
  VIEW_PRODUCT: "view_product", // legacy alias
  PRODUCT_CLICK: "product_click",
  PRODUCT_VARIANT_SELECT: "product_variant_select",
  PRODUCT_FAVORITE: "product_favorite",
  FAVORITE: "favorite", // legacy alias
  PRODUCT_UNFAVORITE: "product_unfavorite",

  // Search Interaction
  SEARCH_PERFORMED: "search_performed",
  SEARCH: "search", // legacy alias
  SEARCH_RESULT_CLICK: "search_result_click",
  SEARCH_NO_RESULTS: "search_no_results",
  SEMANTIC_SEARCH_USED: "semantic_search_used",

  // Cart & Checkout
  ADD_TO_CART: "add_to_cart",
  ADD_TO_CART_ATTEMPT: "add_to_cart_attempt",
  REMOVE_FROM_CART: "remove_from_cart",
  CART_QUANTITY_CHANGE: "cart_quantity_change",
  CHECKOUT_STARTED: "checkout_started",
  CHECKOUT_START: "checkout_start", // legacy alias
  ORDER_PLACED: "order_placed",
  PURCHASE_COMPLETED: "purchase_completed",
  PURCHASE: "purchase", // legacy alias
  PURCHASE_DONE: "purchase_done", // legacy alias
  ORDER_CANCELLED: "order_cancelled",

  // AI & Recommendation
  AI_CHAT_OPENED: "ai_chat_opened",
  AI_PRODUCT_SEARCH: "ai_product_search",
  AI_PRODUCT_RECOMMENDED: "ai_product_recommended",
  AI_RECOMMENDATION_CLICKED: "ai_recommendation_clicked",
  AI_CART_ACTION_CONFIRMED: "ai_cart_action_confirmed",
  RECOMMENDATION_IMPRESSION: "recommendation_impression",
  RECOMMENDATION_CLICKED: "recommendation_clicked",

  // A/B Testing Experiments
  EXPERIMENT_ASSIGNED: "experiment_assigned",
  EXPERIMENT_EXPOSED: "experiment_exposed",
};

// All valid event types
export const ALL_EVENT_TYPES = Object.values(EVENT_TYPES);

// Server-only events (clients are blocked from sending these directly to avoid falsifying purchases/orders)
export const SERVER_ONLY_EVENT_TYPES = [
  EVENT_TYPES.PURCHASE_COMPLETED,
  EVENT_TYPES.PURCHASE,
  EVENT_TYPES.PURCHASE_DONE,
  EVENT_TYPES.ORDER_PLACED,
  EVENT_TYPES.ORDER_CANCELLED,
];

// Events allowed from client
export const CLIENT_ALLOWED_EVENT_TYPES = ALL_EVENT_TYPES.filter(
  (t) => !SERVER_ONLY_EVENT_TYPES.includes(t)
);

// Trọng số hành vi (Weighted Behavioral Scoring)
export const EVENT_WEIGHTS = {
  // High Intent
  [EVENT_TYPES.PURCHASE_COMPLETED]: 5,
  [EVENT_TYPES.PURCHASE]: 5,
  [EVENT_TYPES.PURCHASE_DONE]: 5,
  [EVENT_TYPES.ORDER_PLACED]: 4,
  [EVENT_TYPES.ADD_TO_CART]: 3,
  [EVENT_TYPES.ADD_TO_CART_ATTEMPT]: 0,
  [EVENT_TYPES.PRODUCT_FAVORITE]: 3,
  [EVENT_TYPES.FAVORITE]: 3,
  [EVENT_TYPES.CHECKOUT_STARTED]: 2.5,
  [EVENT_TYPES.CHECKOUT_START]: 2.5,
  [EVENT_TYPES.AI_CART_ACTION_CONFIRMED]: 3,
  [EVENT_TYPES.AI_RECOMMENDATION_CLICKED]: 2,
  [EVENT_TYPES.RECOMMENDATION_CLICKED]: 1.5,

  // Medium Intent
  [EVENT_TYPES.PRODUCT_VIEW]: 1,
  [EVENT_TYPES.VIEW_PRODUCT]: 1,
  [EVENT_TYPES.PRODUCT_CLICK]: 0.8,
  [EVENT_TYPES.PRODUCT_VARIANT_SELECT]: 0.7,
  [EVENT_TYPES.SEARCH_PERFORMED]: 1,
  [EVENT_TYPES.SEARCH]: 1,
  [EVENT_TYPES.SEARCH_RESULT_CLICK]: 1,
  [EVENT_TYPES.SEMANTIC_SEARCH_USED]: 1.2,
  [EVENT_TYPES.CATEGORY_VIEW]: 0.5,

  // Low Intent / Discovery
  [EVENT_TYPES.EXPERIMENT_ASSIGNED]: 0,
  [EVENT_TYPES.EXPERIMENT_EXPOSED]: 0.05,
  [EVENT_TYPES.RECOMMENDATION_IMPRESSION]: 0.1,
  [EVENT_TYPES.PRODUCT_IMPRESSION]: 0.05,
  [EVENT_TYPES.PAGE_VIEW]: 0.05,
  [EVENT_TYPES.AI_CHAT_OPENED]: 0.2,
  [EVENT_TYPES.AI_PRODUCT_SEARCH]: 0.8,
  [EVENT_TYPES.AI_PRODUCT_RECOMMENDED]: 0.1,
  [EVENT_TYPES.SESSION_START]: 0,
  [EVENT_TYPES.SESSION_END]: 0,
  [EVENT_TYPES.SEARCH_NO_RESULTS]: 0.1,

  // Negative Feedback (penalty / decay)
  [EVENT_TYPES.REMOVE_FROM_CART]: -0.5,
  [EVENT_TYPES.PRODUCT_UNFAVORITE]: -1,
  [EVENT_TYPES.ORDER_CANCELLED]: -2,
};

export const HALF_LIFE_DAYS = parseInt(process.env.TRACKING_HALF_LIFE_DAYS || "14", 10);
export const MAX_KEYWORDS = 50;
export const MAX_RECENT_PRODUCTS = 20;
export const DEDUP_TTL_SECONDS = 300; // 5 phút chống ghi trùng cho click/view
export const RECOMMENDATION_CACHE_TTL = 300; // 5 phút cache kết quả đề xuất
export const MAX_BATCH_SIZE = 25; // Tối đa 25 sự kiện mỗi lượt gửi theo lô
