export const EVENT_TYPES = {
  // Navigation & Page Flow
  PAGE_VIEW: "page_view",
  PAGE_ENTER: "page_enter",
  PAGE_LEAVE: "page_leave",
  ROUTE_CHANGED: "route_changed",
  NAVIGATION_CLICKED: "navigation_clicked",
  BROWSER_BACK: "browser_back",
  BROWSER_FORWARD: "browser_forward",
  SESSION_START: "session_start",
  SESSION_END: "session_end",
  CATEGORY_VIEW: "category_view",
  CATEGORY_SELECTED: "category_selected",

  // Presence & Idle State Machine
  USER_BECAME_IDLE: "user_became_idle",
  USER_BECAME_AWAY: "user_became_away",
  USER_RESUMED_ACTIVITY: "user_resumed_activity",
  PAGE_BACKGROUNDED: "page_backgrounded",
  PAGE_FOREGROUNDED: "page_foregrounded",
  SESSION_PRESENCE_LOST: "session_presence_lost",
  PASSIVE_VIEWING_STARTED: "passive_viewing_started",
  PASSIVE_VIEWING_ENDED: "passive_viewing_ended",

  // Product Interaction
  PRODUCT_IMPRESSION: "product_impression",
  PRODUCT_VIEW: "product_view",
  PRODUCT_VIEWED: "product_viewed", // alias
  VIEW_PRODUCT: "view_product", // legacy alias
  PRODUCT_CLICK: "product_click",
  PRODUCT_CLICKED: "product_clicked", // alias
  PRODUCT_VARIANT_SELECT: "product_variant_select",
  PRODUCT_VARIANT_SELECTED: "product_variant_selected", // alias
  PRODUCT_SIZE_SELECTED: "product_size_selected",
  PRODUCT_COLOR_SELECTED: "product_color_selected",
  PRODUCT_QUANTITY_CHANGED: "product_quantity_changed",
  PRODUCT_GALLERY_INTERACTED: "product_gallery_interacted",
  PRODUCT_FAVORITE: "product_favorite",
  FAVORITE: "favorite", // legacy alias
  WISHLIST_ADDED: "wishlist_added", // alias
  PRODUCT_UNFAVORITE: "product_unfavorite",
  WISHLIST_REMOVED: "wishlist_removed", // alias
  BUY_NOW_CLICKED: "buy_now_clicked",

  // Search Interaction
  SEARCH_PERFORMED: "search_performed",
  SEARCH: "search", // legacy alias
  SEARCH_STARTED: "search_started",
  SEARCH_SUBMITTED: "search_submitted",
  SEARCH_RESULT_CLICK: "search_result_click",
  SEARCH_NO_RESULTS: "search_no_results",
  SEMANTIC_SEARCH_USED: "semantic_search_used",
  FILTER_APPLIED: "filter_applied",
  SORT_CHANGED: "sort_changed",

  // Cart & Checkout
  CART_VIEWED: "cart_viewed",
  ADD_TO_CART: "add_to_cart",
  ADD_TO_CART_ATTEMPT: "add_to_cart_attempt",
  REMOVE_FROM_CART: "remove_from_cart",
  CART_ITEM_REMOVED: "cart_item_removed", // alias
  CART_QUANTITY_CHANGE: "cart_quantity_change",
  CHECKOUT_STARTED: "checkout_started",
  CHECKOUT_START: "checkout_start", // legacy alias
  CHECKOUT_STEP_VIEWED: "checkout_step_viewed",
  SHIPPING_STEP_COMPLETED: "shipping_step_completed",
  PAYMENT_METHOD_SELECTED: "payment_method_selected",
  RESERVATION_CREATED: "checkout_reservation_created",
  RESERVATION_EXPIRED: "checkout_reservation_expired",
  RESERVATION_CANCELLED: "checkout_reservation_cancelled",
  CHECKOUT_RESERVATION_CREATED: "checkout_reservation_created",
  CHECKOUT_RESERVATION_CANCELLED: "checkout_reservation_cancelled",
  CHECKOUT_RESERVATION_EXPIRED: "checkout_reservation_expired",
  CHECKOUT_RESERVATION_CONFIRMED: "checkout_reservation_confirmed",
  CHECKOUT_STOCK_INSUFFICIENT: "checkout_stock_insufficient",
  ORDER_PLACED: "order_placed",
  PURCHASE_COMPLETED: "purchase_completed",
  PURCHASE: "purchase", // legacy alias
  PURCHASE_DONE: "purchase_done", // legacy alias
  PAYMENT_CONFIRMED: "payment_confirmed",
  ORDER_CANCELLED: "order_cancelled",
  CHECKOUT_ABANDONED: "checkout_abandoned",

  // AI & Recommendation
  AI_CHAT_OPENED: "ai_chat_opened",
  AI_INTENT_DETECTED: "ai_intent_detected",
  AI_TOOL_ACTION_REQUESTED: "ai_tool_action_requested",
  AI_TOOL_ACTION_CONFIRMED: "ai_tool_action_confirmed",
  AI_TOOL_ACTION_CANCELLED: "ai_tool_action_cancelled",
  AI_TOOL_ACTION_FAILED: "ai_tool_action_failed",
  AI_CHECKOUT_STARTED: "ai_checkout_started",
  AI_PRODUCT_SEARCH: "ai_product_search",
  AI_PRODUCT_RECOMMENDED: "ai_product_recommended",
  AI_RECOMMENDATION_CLICKED: "ai_recommendation_clicked",
  AI_CART_ACTION_CONFIRMED: "ai_cart_action_confirmed",
  RECOMMENDATION_IMPRESSION: "recommendation_impression",
  RECOMMENDATION_CLICKED: "recommendation_clicked",

  // General UI Actions
  BUTTON_CLICKED: "button_clicked",
  MODAL_OPENED: "modal_opened",
  MODAL_CLOSED: "modal_closed",
  TAB_SELECTED: "tab_selected",
  ACCORDION_EXPANDED: "accordion_expanded",
  FORM_STEP_COMPLETED: "form_step_completed",
  NAVIGATION_MENU_CLICKED: "navigation_menu_clicked",

  // UI Performance & API Tracing Diagnostics
  UI_PERFORMANCE_SIGNAL: "ui_performance_signal",
  UI_LONG_TASK: "ui_long_task",
  UI_STALL_SUSPECTED: "ui_stall_suspected",
  API_TRACE: "api_trace",
  API_SLOW: "api_slow",
  API_ERROR: "api_error",

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
  EVENT_TYPES.PAYMENT_CONFIRMED,
  EVENT_TYPES.CHECKOUT_RESERVATION_CREATED,
  EVENT_TYPES.CHECKOUT_RESERVATION_CONFIRMED,
  EVENT_TYPES.CHECKOUT_RESERVATION_EXPIRED,
  EVENT_TYPES.CHECKOUT_RESERVATION_CANCELLED,
  EVENT_TYPES.CHECKOUT_STOCK_INSUFFICIENT,
];

// Trạng thái Presence của người dùng theo thời gian thực
export const PRESENCE_STATUS = {
  ACTIVE: "ACTIVE",
  IDLE: "IDLE",
  AWAY: "AWAY",
  BACKGROUND: "BACKGROUND",
  PASSIVE_VIEWING: "PASSIVE_VIEWING",
  DISCONNECTED: "DISCONNECTED",
  SESSION_ENDED: "SESSION_ENDED",
};

// Cấu hình thời gian chuẩn hóa toàn hệ thống (ms)
export const USER_ACTIVITY_CONFIG = {
  idleAfterMs: 60_000,          // 60s -> IDLE
  awayAfterMs: 300_000,         // 300s -> AWAY / "Treo trang"
  sessionTimeoutMs: 1_800_000,  // 30m -> SESSION_ENDED
  heartbeatIntervalMs: 30_000,  // 30s
  heartbeatGraceMs: 90_000,     // 90s -> DISCONNECTED / PRESENCE_UNKNOWN
  interactionThrottleMs: 1_000,
  apiSlowThresholdMs: 5_000,
  apiStalledThresholdMs: 15_000,
};

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
