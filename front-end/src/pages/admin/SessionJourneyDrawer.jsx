import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Activity,
  ArrowRight,
  Clock,
  Compass,
  AlertTriangle,
  CheckCircle,
  Eye,
  Server,
  Layers,
  ShieldCheck,
  MousePointer,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  CreditCard,
  Zap,
  Play,
  Pause,
  Radio,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  RefreshCw,
  User as UserIcon,
  ArrowDown,
  X,
  ExternalLink,
} from "lucide-react";
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import { formatCurrency } from "@/utils/format";

// ── Vietnamese Event Taxonomy & Badge Styling ────────────────────────────────
export const EVENT_META = {
  // Session & Presence
  session_start: {
    labelVi: "Bắt đầu phiên truy cập",
    icon: Play,
    category: "navigation",
    badgeClass: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  session_end: {
    labelVi: "Kết thúc phiên",
    icon: Pause,
    category: "navigation",
    badgeClass: "border-slate-600/30 bg-slate-500/10 text-slate-700 dark:text-slate-400",
  },
  session_timeout_30m: {
    labelVi: "Hết hạn phiên (30 phút)",
    icon: Clock,
    category: "navigation",
    badgeClass: "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  user_became_idle: {
    labelVi: "Tạm ngưng thao tác (IDLE)",
    icon: Clock,
    category: "interaction",
    badgeClass: "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  user_became_away: {
    labelVi: "Treo trang / Nghỉ (AWAY)",
    icon: AlertTriangle,
    category: "interaction",
    badgeClass: "border-rose-600/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
  user_resumed_activity: {
    labelVi: "Tiếp tục thao tác (ACTIVE)",
    icon: Zap,
    category: "interaction",
    badgeClass: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  tab_switch_background: {
    labelVi: "Chuyển tab khác (BACKGROUND)",
    icon: Layers,
    category: "navigation",
    badgeClass: "border-border bg-muted/40 text-muted-foreground",
  },
  tab_hidden: {
    labelVi: "Thu nhỏ trình duyệt",
    icon: Layers,
    category: "navigation",
    badgeClass: "border-border bg-muted/40 text-muted-foreground",
  },

  // Navigation
  page_view: {
    labelVi: "Xem trang",
    icon: Compass,
    category: "navigation",
    badgeClass: "border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  page_enter: {
    labelVi: "Nạp trang (Page Enter)",
    icon: Compass,
    category: "navigation",
    badgeClass: "border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  page_leave: {
    labelVi: "Rời trang (Page Leave)",
    icon: ArrowRight,
    category: "navigation",
    badgeClass: "border-border bg-muted/40 text-muted-foreground",
  },
  route_change: {
    labelVi: "Chuyển hướng trang SPA",
    icon: ArrowRight,
    category: "navigation",
    badgeClass: "border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  route_changed: {
    labelVi: "Chuyển hướng trang SPA",
    icon: ArrowRight,
    category: "navigation",
    badgeClass: "border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },

  // Interaction
  product_impression: {
    labelVi: "Xuất hiện trên màn hình",
    icon: Eye,
    category: "interaction",
    badgeClass: "border-border bg-muted/20 text-muted-foreground",
  },
  product_view: {
    labelVi: "Xem chi tiết sản phẩm",
    icon: Eye,
    category: "interaction",
    badgeClass: "border-indigo-600/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  },
  product_click: {
    labelVi: "Nhấp vào sản phẩm",
    icon: MousePointer,
    category: "interaction",
    badgeClass: "border-indigo-600/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  },
  search: {
    labelVi: "Tìm kiếm sản phẩm",
    icon: Search,
    category: "interaction",
    badgeClass: "border-blue-600/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  search_performed: {
    labelVi: "Thực hiện tìm kiếm",
    icon: Search,
    category: "interaction",
    badgeClass: "border-blue-600/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  wishlist_added: {
    labelVi: "Thêm vào danh sách yêu thích",
    icon: ShoppingBag,
    category: "interaction",
    badgeClass: "border-pink-600/30 bg-pink-500/10 text-pink-700 dark:text-pink-400",
  },
  wishlist_removed: {
    labelVi: "Xóa khỏi danh sách yêu thích",
    icon: Trash2,
    category: "interaction",
    badgeClass: "border-border bg-muted/40 text-muted-foreground",
  },

  // Checkout & Cart Funnel
  add_to_cart_attempt: {
    labelVi: "Thử thêm vào giỏ (Khách)",
    icon: ShoppingCart,
    category: "checkout",
    badgeClass: "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  add_to_cart: {
    labelVi: "Thêm vào giỏ hàng thành công",
    icon: ShoppingBag,
    category: "checkout",
    badgeClass: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  change_cart_quantity: {
    labelVi: "Đổi số lượng giỏ hàng",
    icon: ShoppingCart,
    category: "checkout",
    badgeClass: "border-blue-600/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  remove_cart_item: {
    labelVi: "Xóa sản phẩm khỏi giỏ",
    icon: Trash2,
    category: "checkout",
    badgeClass: "border-rose-600/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
  cart_viewed: {
    labelVi: "Xem giỏ hàng",
    icon: ShoppingCart,
    category: "checkout",
    badgeClass: "border-blue-600/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  checkout_started: {
    labelVi: "Bắt đầu thanh toán",
    icon: CreditCard,
    category: "checkout",
    badgeClass: "border-purple-600/30 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  checkout_step_viewed: {
    labelVi: "Vào bước thanh toán",
    icon: CreditCard,
    category: "checkout",
    badgeClass: "border-purple-600/30 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  checkout_step_completed: {
    labelVi: "Hoàn tất bước thanh toán",
    icon: CheckCircle,
    category: "checkout",
    badgeClass: "border-purple-600/30 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  reservation_created: {
    labelVi: "Giữ kho Redis 300s",
    icon: Clock,
    category: "checkout",
    badgeClass: "border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  order_placed: {
    labelVi: "Đặt đơn hàng (COD/Chờ duyệt)",
    icon: CheckCircle,
    category: "checkout",
    badgeClass: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  purchase_completed: {
    labelVi: "Thanh toán thành công",
    icon: ShieldCheck,
    category: "checkout",
    badgeClass: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  checkout_abandoned: {
    labelVi: "Bỏ dở thanh toán",
    icon: AlertTriangle,
    category: "checkout",
    badgeClass: "border-rose-600/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },

  // Observability & API
  api_trace: {
    labelVi: "Nhật ký gọi API",
    icon: Server,
    category: "api",
    badgeClass: "border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  api_slow: {
    labelVi: "Cảnh báo API chậm (> 5s)",
    icon: Clock,
    category: "api",
    badgeClass: "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  api_error: {
    labelVi: "Lỗi gọi API hệ thống",
    icon: AlertTriangle,
    category: "api",
    badgeClass: "border-rose-600/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
  ui_long_task: {
    labelVi: "Cảnh báo tác vụ giao diện dài (> 200ms)",
    icon: Clock,
    category: "api",
    badgeClass: "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  ui_hang: {
    labelVi: "Giao diện bị nghẽn (UI Hang)",
    icon: AlertTriangle,
    category: "api",
    badgeClass: "border-rose-600/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
};

const KEY_LABELS = {
  fromStatus: "Trạng thái trước",
  toStatus: "Trạng thái sau",
  reason: "Lý do",
  action: "Hành động kích hoạt",
  product_name: "Tên sản phẩm",
  product_id: "Mã sản phẩm",
  productId: "Mã sản phẩm",
  variant_id: "Mã biến thể",
  variantId: "Mã biến thể",
  price: "Đơn giá",
  quantity: "Số lượng",
  endpoint: "Endpoint API",
  durationMs: "Thời gian xử lý",
  duration_ms: "Thời gian xử lý",
  status: "Mã HTTP",
  errorCategory: "Phân loại lỗi",
  activeMs: "Thời gian thao tác",
  idleMs: "Thời gian không thao tác",
  awayMs: "Thời gian treo trang",
  dwellMs: "Tổng thời gian lưu lại",
  views: "Lượt xem",
  orderId: "Mã đơn hàng",
  order_id: "Mã đơn hàng",
  step: "Bước checkout",
  stepName: "Tên bước",
  query: "Từ khóa tìm kiếm",
  voucherCode: "Mã giảm giá",
  paymentMethod: "Phương thức thanh toán",
};

const REASON_TRANSLATIONS = {
  inactive_60s: "Không có thao tác chuột/phím trong 60 giây",
  inactive_300s: "Không có thao tác trong 5 phút (Treo trang)",
  session_timeout_30m: "Quá 30 phút không hoạt động",
  tab_switch_background: "Người dùng chuyển sang tab khác",
  tab_hidden: "Người dùng thu nhỏ trình duyệt",
  meaningful_interaction: "Người dùng thao tác trở lại",
  resumed_by_pointerdown: "Nhấp chuột trên trang",
  resumed_by_click: "Nhấp chuột trên trang",
  resumed_by_touchstart: "Chạm màn hình",
  resumed_by_keydown_press: "Nhấn phím",
  resumed_by_user_scroll: "Cuộn trang",
  resumed_by_form_change: "Nhập dữ liệu form",
  pagehide: "Rời trang / Đóng tab",
  beforeunload: "Đóng tab trình duyệt",
};

// ── 5 Category Tabs ─────────────────────────────────────────────────────────
export const CATEGORY_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "navigation", label: "Điều hướng" },
  { key: "interaction", label: "Tương tác" },
  { key: "api", label: "API" },
  { key: "checkout", label: "Checkout" },
];

/**
 * Classifies an event into one of the 4 sub-categories
 */
export function getEventCategory(step) {
  const type = (step?.eventType || "").toLowerCase();

  // 1. Checkout & Cart Funnel
  if (
    type.includes("cart") ||
    type.includes("checkout") ||
    type.includes("order") ||
    type.includes("purchase") ||
    type.includes("reservation") ||
    type.includes("payment") ||
    type.includes("coupon") ||
    type.includes("voucher")
  ) {
    return "checkout";
  }

  // 2. API & Observability
  if (
    type.startsWith("api_") ||
    type.includes("trace") ||
    type.includes("hang") ||
    type.includes("long_task") ||
    Boolean(step?.api)
  ) {
    return "api";
  }

  // 3. Navigation & Session Lifecycle
  if (
    type.includes("page_") ||
    type.includes("route_") ||
    type.includes("category_") ||
    type.includes("navigation_") ||
    type.includes("browser_") ||
    type.includes("session_") ||
    type.includes("tab_") ||
    step?.fromPath != null ||
    type === "beforeunload" ||
    type === "pagehide"
  ) {
    return "navigation";
  }

  // 4. Default: User Interaction (clicks, search, idle, resume, scrolls)
  return "interaction";
}

// ── Sensitive Data Redaction / Masking ───────────────────────────────────────
function maskSensitiveValue(key, value) {
  if (value == null) return "—";
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  const k = key.toLowerCase();

  // Tokens & secrets
  if (
    k.includes("token") ||
    k.includes("secret") ||
    k.includes("password") ||
    k.includes("auth") ||
    k.includes("cookie")
  ) {
    if (str.length > 12) {
      return `${str.slice(0, 6)}...••••[đã bảo vệ]`;
    }
    return "••••••••";
  }

  // Emails
  if (k.includes("email") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    const parts = str.split("@");
    if (parts.length === 2) {
      const name = parts[0];
      const masked = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
      return `${masked}@${parts[1]}`;
    }
  }

  // Vietnamese Phone
  if (k.includes("phone") || /^(0|\+?84)\d{9}$/.test(str.replace(/\s+/g, ""))) {
    const clean = str.replace(/\D/g, "");
    if (clean.length >= 9) {
      const last2 = clean.slice(-2);
      const prefix = clean.startsWith("84") ? "+84 " + clean.slice(2, 4) : clean.slice(0, 3);
      return `${prefix}*** ***${last2}`;
    }
  }

  return str;
}

function formatDurationNice(sec) {
  if (!sec || sec < 60) return `${Math.round(sec || 0)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${s}s`;
}

function formatMsNice(ms) {
  if (ms == null || isNaN(ms)) return "0ms";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTimestamp(ts) {
  if (!ts) return "--:--:--";
  const d = new Date(ts);
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateTimeVi(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Presence Badge Renderer ─────────────────────────────────────────────────
function renderPresenceBadge(status, idleSec) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-xs border border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Đang hoạt động
        </span>
      );
    case "IDLE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-xs border border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <Clock className="h-3 w-3" />
          Tạm dừng — {formatDurationNice(idleSec)}
        </span>
      );
    case "AWAY":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-xs border border-rose-600/30 bg-rose-500/10 text-rose-700 dark:text-rose-400">
          <AlertTriangle className="h-3 w-3" />
          Treo trang — {formatDurationNice(idleSec)}
        </span>
      );
    case "BACKGROUND":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-xs border border-border bg-muted/40 text-muted-foreground">
          <Layers className="h-3 w-3" />
          Tab khác / Nền
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-xs border border-border bg-muted/30 text-muted-foreground">
          <Radio className="h-3 w-3" />
          {status || "Ngoại tuyến"}
        </span>
      );
  }
}

// ── Single Step Timeline Card Component ─────────────────────────────────────
function TimelineStepCard({ step, idx }) {
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState({});

  const eventInfo = EVENT_META[step.eventType] || {
    labelVi: (step.eventType || "EVENT").toUpperCase().replace(/_/g, " "),
    icon: Activity,
    category: getEventCategory(step),
    badgeClass: "border-border bg-muted/30 text-foreground",
  };

  const IconComp = eventInfo.icon || Activity;
  const isPersisted = step.persisted !== false;

  // Combine meta, context, api into a key-value set
  const keyValuePairs = useMemo(() => {
    const pairs = [];
    const meta = step.meta || {};

    // 1. Status Transition Special Formatting
    if (meta.fromStatus && meta.toStatus) {
      pairs.push({
        key: "fromStatus",
        label: "Chuyển trạng thái",
        value: `${meta.fromStatus} → ${meta.toStatus}`,
        highlight: true,
      });
    }

    // 2. Reason Special Formatting
    if (meta.reason) {
      const translated = REASON_TRANSLATIONS[meta.reason] || meta.reason;
      pairs.push({
        key: "reason",
        label: "Lý do",
        value: translated,
      });
    }

    // 3. Navigation Details
    if (step.fromPath && step.toPath) {
      pairs.push({
        key: "route_nav",
        label: "Điều hướng",
        value: `${step.fromPath} → ${step.toPath}`,
      });
    } else if (step.pathname) {
      pairs.push({
        key: "pathname",
        label: "Trang",
        value: step.pathname,
      });
    }

    // 4. API Details
    if (step.api) {
      pairs.push({
        key: "api_call",
        label: "Yêu cầu API",
        value: `${step.api.method} ${step.api.endpoint} (${step.api.status})`,
      });
      if (step.api.durationMs != null) {
        pairs.push({
          key: "api_duration",
          label: "Thời gian xử lý",
          value: formatMsNice(step.api.durationMs),
        });
      }
    }

    // 5. Remaining Meta Fields
    Object.entries(meta).forEach(([k, v]) => {
      if (k === "fromStatus" || k === "toStatus" || k === "reason") return;
      let displayValue = v;
      if (k === "price" && typeof v === "number") {
        displayValue = formatCurrency(v);
      } else if (k.endsWith("Ms") && typeof v === "number") {
        displayValue = formatMsNice(v);
      } else if (typeof v === "object" && v !== null) {
        displayValue = JSON.stringify(v);
      } else {
        displayValue = maskSensitiveValue(k, v);
      }

      pairs.push({
        key: k,
        label: KEY_LABELS[k] || k,
        value: displayValue,
      });
    });

    return pairs;
  }, [step]);

  const handleCopyJson = useCallback(async () => {
    try {
      const fullJson = JSON.stringify(step, null, 2);
      await navigator.clipboard.writeText(fullJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [step]);

  const toggleExpand = (key) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="relative pl-7 sm:pl-8 group">
      {/* Timeline Bullet Node with Icon (Letter + Shape, not color alone) */}
      <div
        className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-2 bg-[var(--color-bg)] flex items-center justify-center shrink-0 shadow-xs ${
          eventInfo.category === "api"
            ? "border-sky-600 text-sky-600"
            : eventInfo.category === "checkout"
            ? "border-purple-600 text-purple-600"
            : eventInfo.category === "navigation"
            ? "border-blue-600 text-blue-600"
            : "border-emerald-600 text-emerald-600"
        }`}
        aria-hidden="true"
      >
        <IconComp className="h-2.5 w-2.5" />
      </div>

      {/* Step Time & Delta */}
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-mono text-[11px] text-[var(--color-text-muted)] font-medium">
          {formatTimestamp(step.timestamp || step.createdAt || step.queuedAt)}
        </span>
        {step.deltaFromPrevSec > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-muted/70 text-[var(--color-text-muted)] rounded-xs">
            +{formatDurationNice(step.deltaFromPrevSec)}
          </span>
        )}
      </div>

      {/* Step Card Container */}
      <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-3.5 space-y-2 transition-colors hover:border-[var(--color-border-strong)]">
        {/* Header: Vietnamese Event Title + Original Event Name + Persistence Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border rounded-xs ${eventInfo.badgeClass}`}
            >
              <IconComp className="h-3 w-3 shrink-0" />
              <span>{eventInfo.labelVi}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
              {step.eventType}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Persistence Status Badge */}
            {isPersisted ? (
              <span
                data-testid="event-persisted-badge"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded-xs border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                title="Sự kiện đã được Worker lưu vào MongoDB"
              >
                <CheckCircle className="h-2.5 w-2.5 text-emerald-600" />
                <span>Đã lưu MongoDB</span>
              </span>
            ) : (
              <span
                data-testid="event-queued-badge"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded-xs border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                title="Sự kiện đang trong hàng đợi BullMQ, chuẩn bị persist"
              >
                <Clock className="h-2.5 w-2.5 text-amber-600 animate-pulse" />
                <span>Đang hàng đợi</span>
              </span>
            )}

            {step.actionId && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-muted/40 text-[var(--color-text-muted)] border border-border">
                {step.actionId}
              </span>
            )}
          </div>
        </div>

        {/* Structured Key-Value List */}
        {keyValuePairs.length > 0 && (
          <div className="mt-2 space-y-1.5 pt-1 border-t border-[var(--color-border)] text-xs">
            {keyValuePairs.map((pair) => {
              const valStr = String(pair.value);
              const isLong = valStr.length > 80;
              const isExpanded = expandedKeys[pair.key];
              const displayVal = isLong && !isExpanded ? `${valStr.slice(0, 80)}...` : valStr;

              return (
                <div
                  key={pair.key}
                  className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-[11px] leading-relaxed"
                >
                  <span className="text-[var(--color-text-muted)] font-medium shrink-0 pr-2">
                    {pair.label}:
                  </span>
                  <div className="font-mono text-left sm:text-right break-words overflow-hidden text-[var(--color-text)]">
                    <span className={pair.highlight ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}>
                      {displayVal}
                    </span>
                    {isLong && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(pair.key)}
                        className="ml-1.5 text-[10px] text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        {isExpanded ? (
                          <>
                            Thu gọn <ChevronUp className="h-2.5 w-2.5" />
                          </>
                        ) : (
                          <>
                            Xem thêm <ChevronDown className="h-2.5 w-2.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Raw JSON & Copy Buttons */}
        <div className="pt-2 flex items-center justify-between border-t border-[var(--color-border)]/60 text-[10px]">
          <button
            type="button"
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline underline-offset-2 transition-colors font-mono"
          >
            {showRawJson ? "Ẩn JSON thô" : "Xem JSON chi tiết"}
          </button>

          {showRawJson && (
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1 px-2 py-0.5 border border-border bg-[var(--color-bg)] hover:bg-[var(--color-surface)] text-[var(--color-text)] font-mono transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Sao chép JSON</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Raw JSON Pre Block */}
        {showRawJson && (
          <div className="mt-2 relative">
            <pre className="p-2.5 bg-black/50 text-[10px] font-mono text-slate-200 border border-border overflow-x-auto rounded-xs max-h-56 overscroll-contain">
              {JSON.stringify(step, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Session Journey Drawer Component ───────────────────────────────────
export function SessionJourneyDrawer({
  isOpen,
  onClose,
  sessionId,
  sessionDetail,
  sessionSummary,
  loading = false,
  error = null,
  socket = null,
  onRefresh = null,
}) {
  const [filterType, setFilterType] = useState("ALL"); // 'ALL' | 'navigation' | 'interaction' | 'api' | 'checkout'
  const [searchWord, setSearchWord] = useState("");
  const [visibleCount, setVisibleCount] = useState(100);
  const [copiedSessionId, setCopiedSessionId] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

  // Local state for timeline events to support seamless Socket.IO streaming without page reload
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [newEventsCount, setNewEventsCount] = useState(0);

  // Live presence state tracking
  const [livePresence, setLivePresence] = useState({
    status: sessionSummary?.overallStatus || "ACTIVE",
    idleSec: sessionSummary?.idleDurationSec || 0,
    activeSec: sessionSummary?.activeDurationSec || 0,
    sessionDurationSec: sessionSummary?.sessionDurationSec || 0,
    currentRoute: sessionSummary?.currentRoute || "/",
    entrySource: sessionSummary?.entrySource || "direct",
  });

  const timelineContainerRef = useRef(null);
  const timelineBottomRef = useRef(null);
  const isNearBottomRef = useRef(true);

  // Initialize or reset timeline when sessionDetail or sessionId changes
  useEffect(() => {
    if (sessionDetail?.timeline) {
      setTimelineEvents(sessionDetail.timeline);
      setNewEventsCount(0);
    } else {
      setTimelineEvents([]);
    }
  }, [sessionDetail, sessionId]);

  // Update live presence info when sessionSummary changes
  useEffect(() => {
    if (sessionSummary) {
      setLivePresence({
        status: sessionSummary.overallStatus || "ACTIVE",
        idleSec: sessionSummary.idleDurationSec || 0,
        activeSec: sessionSummary.activeDurationSec || 0,
        sessionDurationSec: sessionSummary.sessionDurationSec || 0,
        currentRoute: sessionSummary.currentRoute || "/",
        entrySource: sessionSummary.entrySource || "direct",
      });
    }
  }, [sessionSummary]);

  // Handle Realtime Socket.IO Events for this session
  useEffect(() => {
    if (!socket || !isOpen || !sessionId) return;

    // 1. New event entered BullMQ Queue
    const handleEventQueued = (payload) => {
      if (payload?.sessionId !== sessionId || !payload?.event) return;
      const newEv = {
        ...payload.event,
        eventId: payload.event.eventId || `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        persisted: false,
        timestamp: payload.event.queuedAt || new Date().toISOString(),
      };

      setTimelineEvents((prev) => {
        // Prevent duplicate eventId
        if (prev.some((e) => e.eventId === newEv.eventId)) return prev;
        return [...prev, newEv];
      });

      if (!isNearBottomRef.current) {
        setNewEventsCount((c) => c + 1);
      } else {
        setTimeout(() => {
          timelineBottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 80);
      }
    };

    // 2. Event persisted to MongoDB
    const handleEventPersisted = (payload) => {
      if (payload?.sessionId !== sessionId || !payload?.eventId) return;

      setTimelineEvents((prev) =>
        prev.map((ev) => {
          if (ev.eventId === payload.eventId || ev.actionId === payload.eventId) {
            return {
              ...ev,
              persisted: true,
              persistedAt: payload.persistedAt || new Date().toISOString(),
            };
          }
          return ev;
        })
      );
    };

    // 3. Presence heartbeat / route transition updated
    const handlePresenceUpdated = (payload) => {
      if (payload?.sessionId === sessionId) {
        setLivePresence((prev) => ({
          ...prev,
          status: payload.status || prev.status,
          idleSec: payload.idleDurationSec ?? prev.idleSec,
          activeSec: payload.activeDurationSec ?? prev.activeSec,
          sessionDurationSec: payload.sessionDurationSec ?? prev.sessionDurationSec,
          currentRoute: payload.currentRoute || prev.currentRoute,
        }));
      }
    };

    // 4. Socket reconnect handler
    const handleConnect = () => {
      onRefresh?.();
    };

    socket.on("journey:event_queued", handleEventQueued);
    socket.on("journey:event_persisted", handleEventPersisted);
    socket.on("presence:updated", handlePresenceUpdated);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("journey:event_queued", handleEventQueued);
      socket.off("journey:event_persisted", handleEventPersisted);
      socket.off("presence:updated", handlePresenceUpdated);
      socket.off("connect", handleConnect);
    };
  }, [socket, isOpen, sessionId, onRefresh]);

  // Track scroll position to decide whether to auto-scroll or show floating indicator
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    isNearBottomRef.current = distanceToBottom < 100;
    if (isNearBottomRef.current) {
      setNewEventsCount(0);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    timelineBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewEventsCount(0);
  }, []);

  // Filter counts for 5 tabs
  const counts = useMemo(() => {
    let navigation = 0;
    let interaction = 0;
    let api = 0;
    let checkout = 0;

    timelineEvents.forEach((step) => {
      const cat = getEventCategory(step);
      if (cat === "navigation") navigation++;
      else if (cat === "interaction") interaction++;
      else if (cat === "api") api++;
      else if (cat === "checkout") checkout++;
    });

    return {
      total: timelineEvents.length,
      navigation,
      interaction,
      api,
      checkout,
    };
  }, [timelineEvents]);

  // Filtered & searched timeline
  const filteredTimeline = useMemo(() => {
    let list = timelineEvents;

    if (filterType !== "ALL") {
      list = list.filter((s) => getEventCategory(s) === filterType);
    }

    if (searchWord.trim()) {
      const q = searchWord.trim().toLowerCase();
      list = list.filter((s) => {
        const text = `${s.eventType || ""} ${EVENT_META[s.eventType]?.labelVi || ""} ${s.pathname || ""} ${s.fromPath || ""} ${s.toPath || ""} ${s.actionId || ""} ${JSON.stringify(s.api || {})} ${JSON.stringify(s.meta || {})}`.toLowerCase();
        return text.includes(q);
      });
    }

    return list;
  }, [timelineEvents, filterType, searchWord]);

  // Paginated slice
  const displayedTimeline = useMemo(() => {
    return filteredTimeline.slice(0, visibleCount);
  }, [filteredTimeline, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 50);
  };

  const handleCopySession = async () => {
    if (!sessionId) return;
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopiedSessionId(true);
      setTimeout(() => setCopiedSessionId(false), 2000);
    } catch { /* Clipboard access can be denied by the browser. */ }
  };

  const handleCopyUid = async (uid) => {
    if (!uid) return;
    try {
      await navigator.clipboard.writeText(uid);
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
    } catch { /* Clipboard access can be denied by the browser. */ }
  };

  // Header Title Component with Vietnamese Title and Session Code
  const titleComponent = (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="font-sans text-base sm:text-lg font-bold tracking-tight text-[var(--color-text)] uppercase">
          HÀNH TRÌNH NGƯỜI DÙNG
        </h2>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="Làm mới hành trình từ MongoDB"
            className="p-1 border border-border bg-[var(--color-bg)] hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-sky-600" : ""}`} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-mono text-[var(--color-text-muted)]">
        <span>Phiên:</span>
        <span className="font-semibold text-foreground select-all">
          {sessionId ? `${sessionId.slice(0, 16)}...` : "—"}
        </span>
        {sessionId && (
          <button
            type="button"
            onClick={handleCopySession}
            title="Sao chép toàn bộ Session ID"
            className="hover:text-foreground inline-flex items-center gap-0.5 ml-0.5"
          >
            {copiedSessionId ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  const account = sessionDetail?.account || sessionSummary?.account;
  const isGuest = !account && !sessionDetail?.userId && !sessionSummary?.userId;

  return (
    <AdminDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={titleComponent}
      width="journey"
    >
      <div
        ref={timelineContainerRef}
        onScroll={handleScroll}
        className="space-y-4 text-left"
      >
        {/* 0. Real User Account Identity Banner */}
        {account ? (
          account.error ? (
            /* Warning: Deleted account or unable to load */
            <div className="p-3 border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 rounded-xs font-mono">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold">{account.error}</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5 truncate">
                  UID: {account.userId} • Dữ liệu tài khoản trong MongoDB có thể đã thay đổi
                </p>
              </div>
            </div>
          ) : (
            /* Authenticated Real User Identity Card */
            <div className="p-3.5 border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xs rounded-xs space-y-2.5">
              <div className="flex items-center gap-3">
                <img
                  src={account.avatarUrl || "https://cdn.sforum.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg"}
                  alt={account.fullName}
                  className="h-11 w-11 rounded-full object-cover border-2 border-border shrink-0 shadow-xs"
                  onError={(e) => {
                    e.currentTarget.src = "https://cdn.sforum.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground truncate max-w-[180px]">
                      {account.fullName}
                    </h3>
                    <span
                      className={`px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider rounded-xs border ${
                        account.role === "admin"
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
                          : "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400"
                      }`}
                    >
                      {account.role === "admin" ? "Admin" : "Khách hàng"}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider rounded-xs border ${
                        account.status === "active"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
                      }`}
                    >
                      {account.status === "active" ? "Hoạt động" : "Bị khóa"}
                    </span>
                    {renderPresenceBadge(livePresence.status, livePresence.idleSec)}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5 font-mono">
                    {account.email && (
                      <span className="truncate">Email: {account.email}</span>
                    )}
                    {account.username && <span>@{account.username}</span>}
                  </div>
                </div>
              </div>

              {/* Account UID & Start Time Row */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[10px] font-mono text-muted-foreground">
                <div className="truncate flex items-center gap-1">
                  <span>UID:</span>
                  <span className="text-foreground select-all font-semibold" title={account.userId}>
                    {account.userId ? `${account.userId.slice(0, 10)}...` : "—"}
                  </span>
                  {account.userId && (
                    <button
                      type="button"
                      onClick={() => handleCopyUid(account.userId)}
                      className="hover:text-foreground"
                      title="Sao chép UID"
                    >
                      {copiedUserId ? (
                        <Check className="h-2.5 w-2.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-2.5 w-2.5" />
                      )}
                    </button>
                  )}
                </div>
                <div className="text-right truncate">
                  <span>Bắt đầu: </span>
                  <span className="text-foreground">
                    {formatTimestamp(sessionDetail?.sessionStartedAt || sessionSummary?.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          )
        ) : (
          /* Guest Identity Card */
          <div className="p-3 border border-purple-500/20 bg-purple-500/5 text-xs rounded-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">Khách vãng lai</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-400 rounded-xs">
                      Khách
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Phiên ẩn danh (Guest Session)
                  </p>
                </div>
              </div>
              <div>{renderPresenceBadge(livePresence.status, livePresence.idleSec)}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-500/20 text-[10px] font-mono text-muted-foreground">
              <div className="truncate">
                <span>Mã phiên: </span>
                <span className="text-foreground select-all">
                  {sessionId ? `${sessionId.slice(0, 12)}...` : "—"}
                </span>
              </div>
              <div className="text-right truncate">
                <span>Bắt đầu: </span>
                <span className="text-foreground">
                  {formatTimestamp(sessionDetail?.sessionStartedAt || sessionSummary?.createdAt)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 1. Session Summary Card (Overview Metrics) */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-3 rounded-xs space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Tổng quan phiên truy cập
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
            {/* Nguồn truy cập */}
            <div className="p-2 border border-border/60 bg-muted/20">
              <div className="text-[10px] text-muted-foreground uppercase">Nguồn</div>
              <div className="font-semibold text-foreground truncate mt-0.5">
                {livePresence.entrySource || "direct"}
              </div>
            </div>

            {/* Trang hiện tại */}
            <div className="p-2 border border-border/60 bg-muted/20">
              <div className="text-[10px] text-muted-foreground uppercase">Trang hiện tại</div>
              <div className="font-semibold text-foreground truncate mt-0.5" title={livePresence.currentRoute}>
                {livePresence.currentRoute || "/"}
              </div>
            </div>

            {/* Thời lượng phiên */}
            <div className="p-2 border border-border/60 bg-muted/20">
              <div className="text-[10px] text-muted-foreground uppercase">Thời lượng phiên</div>
              <div className="font-semibold text-foreground truncate mt-0.5">
                {formatDurationNice(livePresence.sessionDurationSec)}
              </div>
            </div>

            {/* Thời gian thao tác */}
            <div className="p-2 border border-border/60 bg-muted/20">
              <div className="text-[10px] text-muted-foreground uppercase">Thao tác tích cực</div>
              <div className="font-semibold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                {formatDurationNice(livePresence.activeSec)}
              </div>
            </div>

            {/* Thời gian nghỉ */}
            <div className="p-2 border border-border/60 bg-muted/20">
              <div className="text-[10px] text-muted-foreground uppercase">Tạm dừng / Nghỉ</div>
              <div className="font-semibold text-amber-600 dark:text-amber-400 truncate mt-0.5">
                {formatDurationNice(livePresence.idleSec)}
              </div>
            </div>

            {/* Tổng sự kiện */}
            <div className="p-2 border border-border/60 bg-muted/20">
              <div className="text-[10px] text-muted-foreground uppercase">Tổng sự kiện</div>
              <div className="font-semibold text-foreground truncate mt-0.5">
                {counts.total} sự kiện
              </div>
            </div>
          </div>
        </div>

        {/* 2. 5 Category Filter Tabs & In-Drawer Search */}
        <div className="space-y-2 border-b border-[var(--color-border)] pb-3">
          {/* 5 Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {CATEGORY_TABS.map((tab) => {
              const count =
                tab.key === "ALL"
                  ? counts.total
                  : counts[tab.key] || 0;
              const isActive = filterType === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  data-testid={`filter-tab-${tab.key}`}
                  onClick={() => setFilterType(tab.key)}
                  className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border transition-colors ${
                    isActive
                      ? "border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                  }`}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Input inside Drawer */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              data-testid="drawer-search-input"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              placeholder="Tìm theo sự kiện, đường dẫn, từ khóa..."
              className="w-full pl-8 pr-8 py-1.5 text-xs font-mono border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text)]"
            />
            {searchWord && (
              <button
                type="button"
                onClick={() => setSearchWord("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Error Banner */}
        {error && (
          <div className="p-3 border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between rounded-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="px-2 py-0.5 border border-rose-500 text-rose-700 dark:text-rose-300 font-semibold uppercase text-[10px] hover:bg-rose-500/20"
              >
                Thử lại
              </button>
            )}
          </div>
        )}

        {/* 4. Loading State Skeleton */}
        {loading && timelineEvents.length === 0 ? (
          <div className="space-y-4 p-4 text-center">
            <div className="text-xs font-mono text-[var(--color-text-muted)] mb-3">
              Đang tải hành trình người dùng từ MongoDB...
            </div>
            <div className="h-4 bg-muted animate-pulse w-3/4 mx-auto" />
            <div className="h-4 bg-muted animate-pulse w-1/2 mx-auto" />
            <div className="h-20 bg-muted animate-pulse" />
            <div className="h-20 bg-muted animate-pulse" />
          </div>
        ) : filteredTimeline.length === 0 ? (
          /* Empty State */
          <div className="p-8 text-center text-[var(--color-text-muted)] text-xs border border-dashed border-[var(--color-border)] space-y-1">
            <p className="font-semibold text-foreground">
              Chưa ghi nhận hành trình cho phiên này.
            </p>
            <p className="text-[11px]">
              Các sự kiện tương tác và điều hướng sẽ xuất hiện tại đây khi người dùng thao tác trên website.
            </p>
          </div>
        ) : (
          /* 5. Render Vertical Timeline */
          <div className="relative border-l-2 border-[var(--color-border)] ml-3 sm:ml-4 space-y-6 pt-1 pb-4">
            {displayedTimeline.map((step, idx) => (
              <TimelineStepCard key={step.eventId || idx} step={step} idx={idx} />
            ))}

            <div ref={timelineBottomRef} />

            {/* Load More Button for Long Lists (> 100 items) */}
            {filteredTimeline.length > visibleCount && (
              <div className="pl-7 pt-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors text-[var(--color-text)] font-mono"
                >
                  Tải thêm 50 sự kiện ({displayedTimeline.length} / {filteredTimeline.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6. Floating New Event Notification Pill */}
        {newEventsCount > 0 && (
          <div className="sticky bottom-4 left-0 right-0 flex justify-center z-20 pointer-events-none">
            <button
              type="button"
              onClick={scrollToBottom}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-foreground text-background text-xs font-semibold shadow-xl hover:opacity-90 transition-all"
            >
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
              <span>Có {newEventsCount} sự kiện mới ↓</span>
            </button>
          </div>
        )}
      </div>
    </AdminDrawer>
  );
}

export default SessionJourneyDrawer;
