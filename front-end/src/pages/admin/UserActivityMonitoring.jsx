import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Activity,
  Users,
  Clock,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  ArrowRight,
  ChevronRight,
  X,
  Server,
  Compass,
  Monitor,
  Smartphone,
  Layers,
  Flame,
  ShieldCheck,
  MousePointer,
  Radio,
} from "lucide-react";
import trackingApi from "@/api/trackingApi";
import { io } from "socket.io-client";
import { tokenStorage } from "@/utils/token";
import { ENV } from "@/config/env";
import SessionJourneyDrawer from "./SessionJourneyDrawer";
import {
  AdminPageHeader,
  AdminCard,
  AdminBadge,
  KPISkeleton,
  TableSkeleton,
} from "@/components/admin/ui";
import { PRESENCE_STATUS } from "@/config/activityConfig";

const getSocketBaseUrl = (apiUrl) => {
  const baseUrl = typeof apiUrl === "string" && apiUrl.trim() ? apiUrl : ENV.API_BASE_URL;
  if (!baseUrl) return typeof window !== "undefined" ? window.location.origin : "";
  try {
    const parsed = new URL(baseUrl, typeof window !== "undefined" ? window.location.origin : undefined);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
};

const formatSeconds = (sec) => {
  if (sec == null || isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const formatDurationNice = (sec) => {
  if (!sec || sec < 60) return `${Math.round(sec || 0)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${s}s`;
};


export const UserActivityMonitoring = () => {
  const [activeTab, setActiveTab] = useState("live"); // 'live' | 'pages' | 'api' | 'acquisition'
  const [loadingLive, setLoadingLive] = useState(true);
  const [, setLoadingAnalytics] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5s
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [userTypeFilter, setUserTypeFilter] = useState("ALL"); // 'ALL' | 'authenticated' | 'guest'
  const [searchQuery, setSearchQuery] = useState("");

  // Live presence state
  const [liveData, setLiveData] = useState({
    sessions: [],
    counts: {
      total: 0,
      active: 0,
      idle: 0,
      away: 0,
      background: 0,
      disconnected: 0,
      guestCount: 0,
      authenticatedCount: 0,
    },
    redisConnected: true,
  });

  // Timeline drawer state
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);

  // Analytics aggregate state
  const [analyticsData, setAnalyticsData] = useState({
    pageAnalytics: [],
    trafficSources: [],
    apiMetrics: [],
    checkoutFunnel: {},
  });

  const timerRef = useRef(null);

  /**
   * Tải danh sách phiên trực tuyến từ Redis Presence
   */
  const fetchLivePresence = useCallback(async () => {
    try {
      const res = await trackingApi.getLiveSessions({
        statusFilter: statusFilter !== "ALL" ? statusFilter : undefined,
        routeFilter: searchQuery.trim() || undefined,
        limit: 100,
      });
      if (res?.data) {
        setLiveData(res.data);
      }
    } catch {
      // Nuốt lỗi định kỳ
    } finally {
      setLoadingLive(false);
    }
  }, [statusFilter, searchQuery]);

  /**
   * Tải thống kê tổng hợp (Page duration, API, Acquisition)
   */
  const fetchActivityAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await trackingApi.getActivityAnalytics({});
      if (res?.data) {
        setAnalyticsData(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  /**
   * Tải chi tiết hành trình timeline khi chọn session
   */
  const fetchSessionTimeline = useCallback(async (sessionId) => {
    if (!sessionId) return;
    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const res = await trackingApi.getSessionTimeline(sessionId);
      if (res?.data) {
        setSessionDetail(res.data);
      } else {
        setTimelineError("Không thể tải dữ liệu hành trình.");
      }
    } catch (err) {
      setTimelineError(err?.message || "Không thể tải dữ liệu hành trình. Vui lòng thử lại.");
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  // Thiết lập Socket.IO Real-time Stream và chu kỳ tự động cập nhật (Không cần F5)
  useEffect(() => {
    fetchLivePresence();

    const token = tokenStorage.getToken();
    let socket = null;

    try {
      const socketUrl = getSocketBaseUrl(ENV.API_BASE_URL);
      socket = io(socketUrl, {
        auth: { token },
        transports: ["websocket", "polling"],
      });

      socket.emit("joinAdmin");
      setSocketInstance(socket);

      socket.on("presence:updated", () => {
        // Cập nhật tức thì khi có nhịp tim hoặc thao tác mới
        fetchLivePresence();
      });

      socket.on("presence:leave", () => {
        // Cập nhật tức thì khi có tab đóng hoặc rời trang
        fetchLivePresence();
      });
    } catch {
      // Fallback sang timer polling
    }

    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        fetchLivePresence();
      }, refreshInterval);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (socket) {
        socket.disconnect();
        setSocketInstance(null);
      }
    };
  }, [autoRefresh, refreshInterval, fetchLivePresence]);

  // Tải dữ liệu analytics khi chuyển tab
  useEffect(() => {
    if (activeTab !== "live") {
      fetchActivityAnalytics();
    }
  }, [activeTab, fetchActivityAnalytics]);

  // Mở timeline chi tiết
  const handleOpenTimeline = (sid) => {
    setSelectedSessionId(sid);
    fetchSessionTimeline(sid);
  };

  const handleCloseTimeline = () => {
    setSelectedSessionId(null);
    setSessionDetail(null);
    setTimelineError(null);
  };

  /**
   * Render badge trạng thái chuẩn hóa
   */
  const renderStatusBadge = (status, idleSec) => {
    switch (status) {
      case PRESENCE_STATUS.ACTIVE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase border border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Đang hoạt động
          </span>
        );
      case PRESENCE_STATUS.IDLE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase border border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            Không hoạt động — {formatSeconds(idleSec)}
          </span>
        );
      case PRESENCE_STATUS.AWAY:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase border border-rose-600/30 bg-rose-500/10 text-rose-700 dark:text-rose-400">
            <AlertTriangle className="h-3 w-3" />
            Treo trang / Nghỉ — {formatSeconds(idleSec)}
          </span>
        );
      case PRESENCE_STATUS.BACKGROUND:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase border border-border bg-muted/30 text-muted-foreground">
            <Layers className="h-3 w-3" />
            Tab khác / Background
          </span>
        );
      case PRESENCE_STATUS.PASSIVE_VIEWING:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase border border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-400">
            <Radio className="h-3 w-3 animate-pulse" />
            Đang phát media
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase border border-border bg-muted/20 text-muted-foreground">
            Mất tín hiệu
          </span>
        );
    }
  };

  const counts = liveData.counts || {};

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* 1. Page Header with Live Stream Controls */}
      <AdminPageHeader
        title="Giám Sát Trực Tuyến & Hành Trình Người Dùng"
        subtitle="Hệ thống Real-time Presence, phát hiện trạng thái treo trang (Inactivity), đo lường thời gian tương tác thực tế và quan sát API toàn diện"
        action={
          <div className="flex flex-wrap items-center gap-3">
            {/* Auto refresh status pill */}
            <div className="flex items-center gap-2 border border-border bg-[var(--color-surface)] px-3 py-1.5 text-xs font-mono">
              <span
                className={`h-2 w-2 rounded-full ${
                  autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                }`}
              />
              <span className="text-muted-foreground">
                {autoRefresh ? `Tự động cập nhật (${refreshInterval / 1000}s)` : "Đã tạm dừng"}
              </span>
            </div>

            {/* Toggle Pause / Resume */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="inline-flex items-center gap-1.5 border border-border bg-[var(--color-surface)] hover:bg-[var(--color-bg)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              {autoRefresh ? (
                <>
                  <Pause className="h-3.5 w-3.5" /> Tạm dừng
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> Tiếp tục
                </>
              )}
            </button>

            {/* Interval Selector */}
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="border border-border bg-[var(--color-surface)] px-2.5 py-1.5 text-xs font-mono focus:outline-none"
            >
              <option value={3000}>3 giây</option>
              <option value={5000}>5 giây</option>
              <option value={10000}>10 giây</option>
              <option value={30000}>30 giây</option>
            </select>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={() => {
                fetchLivePresence();
                if (activeTab !== "live") fetchActivityAnalytics();
              }}
              className="inline-flex items-center gap-1.5 border border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-opacity hover:opacity-90"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Làm mới
            </button>
          </div>
        }
      />

      {/* 2. Overview KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {/* Card 1: Total */}
        <AdminCard className="p-4 border-l-2 border-l-[var(--color-text)]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-widest">Tổng Phiên</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight">{counts.total || 0}</div>
          <div className="mt-1 text-[10px]">
            {loadingLive && !liveData.sessions.length ? (
              <span className="text-muted-foreground">Đang đồng bộ...</span>
            ) : liveData.redisConnected ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Redis Real-time
              </span>
            ) : (
              <span className="text-rose-500 font-medium">Redis Mất kết nối</span>
            )}
          </div>
        </AdminCard>

        {/* Card 2: Authenticated */}
        <AdminCard className="p-4 border-l-2 border-l-blue-500">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[10px] font-semibold uppercase tracking-widest">Thành Viên</span>
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {counts.authenticatedCount || 0}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Đã đăng nhập</p>
        </AdminCard>

        {/* Card 3: Guests */}
        <AdminCard className="p-4 border-l-2 border-l-purple-500">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-[10px] font-semibold uppercase tracking-widest">Khách Vãng Lai</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {counts.guestCount || 0}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Khách chưa login</p>
        </AdminCard>

        {/* Card 4: Active */}
        <AdminCard className="p-4 border-l-2 border-l-emerald-500">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] font-semibold uppercase tracking-widest">Đang Thao Tác</span>
            <Activity className="h-4 w-4 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {counts.active || 0}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">&lt; 60s tương tác</p>
        </AdminCard>

        {/* Card 5: Idle */}
        <AdminCard className="p-4 border-l-2 border-l-amber-500">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[10px] font-semibold uppercase tracking-widest">Không Thao Tác</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {counts.idle || 0}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">60s - 300s đứng yên</p>
        </AdminCard>

        {/* Card 6: Away ("Treo trang") */}
        <AdminCard className="p-4 border-l-2 border-l-rose-500">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-[10px] font-semibold uppercase tracking-widest">Treo Trang / Nghỉ</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {counts.away || 0}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">≥ 5 phút không thao tác</p>
        </AdminCard>

        {/* Card 7: Background */}
        <AdminCard className="p-4 border-l-2 border-l-border">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-widest">Tab Khác</span>
            <Layers className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">{counts.background || 0}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">Chuyển tab / Thu nhỏ</p>
        </AdminCard>

        {/* Card 8: Disconnected */}
        <AdminCard className="p-4 border-l-2 border-l-border">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-widest">Mất Tín Hiệu</span>
            <Radio className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">{counts.disconnected || 0}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">&gt; 90s không heartbeat</p>
        </AdminCard>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("live")}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-[2px] ${
              activeTab === "live"
                ? "border-[var(--color-text)] text-[var(--color-text)]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Phiên Trực Tuyến ({liveData.sessions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pages")}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-[2px] ${
              activeTab === "pages"
                ? "border-[var(--color-text)] text-[var(--color-text)]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Thời Lượng Trang & Tương Tác
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("api")}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-[2px] ${
              activeTab === "api"
                ? "border-[var(--color-text)] text-[var(--color-text)]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Quan Sát API (Observability)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("acquisition")}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-[2px] ${
              activeTab === "acquisition"
                ? "border-[var(--color-text)] text-[var(--color-text)]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Nguồn Truy Cập & Phễu Chuyển Đổi
          </button>
        </div>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: LIVE SESSIONS TABLE */}
      {activeTab === "live" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-[var(--color-surface)] p-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* User Type pills */}
              <div className="flex items-center gap-1 border-r border-border pr-3">
                {[
                  { key: "ALL", label: "Tất cả User" },
                  { key: "authenticated", label: "Thành viên" },
                  { key: "guest", label: "Khách vãng lai" },
                ].map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setUserTypeFilter(pill.key)}
                    className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      userTypeFilter === pill.key
                        ? "bg-[var(--color-text)] text-[var(--color-bg)]"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Status pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: "ALL", label: "Mọi trạng thái" },
                  { key: "ACTIVE", label: "Đang hoạt động" },
                  { key: "IDLE", label: "Không hoạt động" },
                  { key: "AWAY", label: "Treo trang" },
                  { key: "BACKGROUND", label: "Tab khác" },
                ].map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setStatusFilter(pill.key)}
                    className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      statusFilter === pill.key
                        ? "bg-[var(--color-text)] text-[var(--color-bg)]"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Route & Session Search */}
            <div className="relative min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Lọc theo route (vd: /products, /cart)..."
                className="w-full pl-9 pr-3 py-1.5 border border-border bg-[var(--color-bg)] text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <AdminCard className="overflow-hidden">
            {loadingLive && liveData.sessions.length === 0 ? (
              <TableSkeleton rows={6} cols={7} />
            ) : (() => {
              const displayedSessions = liveData.sessions.filter((s) => {
                if (userTypeFilter !== "ALL" && s.userType !== userTypeFilter) {
                  return false;
                }
                return true;
              });

              if (displayedSessions.length === 0) {
                return (
                  <div className="p-12 text-center text-muted-foreground">
                    <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm font-semibold uppercase tracking-wider">
                      Chưa ghi nhận phiên truy cập phù hợp
                    </p>
                    <p className="mt-1 text-xs">Mở website trên tab khác để xem tín hiệu Presence cập nhật trực tiếp theo thời gian thực</p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                        <th className="py-3 px-4">Phiên / Tab</th>
                        <th className="py-3 px-4">Người Dùng</th>
                        <th className="py-3 px-4">Loại</th>
                        <th className="py-3 px-4">User ID</th>
                        <th className="py-3 px-4">Vai Trò</th>
                        <th className="py-3 px-4">Trạng Thái</th>
                        <th className="py-3 px-4">Trang Đang Xem</th>
                        <th className="py-3 px-4">Thao Tác Cuối</th>
                        <th className="py-3 px-4">Thời Gian</th>
                        <th className="py-3 px-4 text-right">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {displayedSessions.map((s) => (
                        <tr
                          key={s.sessionId}
                          className="hover:bg-muted/10 transition-colors cursor-pointer group"
                          onClick={() => handleOpenTimeline(s.sessionId)}
                        >
                          {/* Session ID & Tabs */}
                          <td className="py-3 px-4 font-mono">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {s.sessionId.slice(0, 16)}...
                              {s.tabCount > 1 && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-muted border border-border font-bold">
                                  {s.tabCount} tabs
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              Phiên: {formatDurationNice(s.sessionDurationSec)}
                            </span>
                          </td>

                          {/* User Display & Avatar */}
                          <td className="py-3 px-4">
                            {s.account ? (
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={s.account.avatarUrl || "https://cdn.sforum.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg"}
                                  alt={s.account.fullName}
                                  className="h-8 w-8 rounded-full object-cover border border-border shrink-0 shadow-2xs"
                                  onError={(e) => {
                                    e.currentTarget.src = "https://cdn.sforum.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg";
                                  }}
                                />
                                <div className="min-w-0">
                                  <div className="font-semibold text-foreground truncate max-w-[150px]" title={s.account.fullName}>
                                    {s.account.fullName}
                                  </div>
                                  <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[150px]" title={s.account.email || s.account.username}>
                                    {s.account.email || (s.account.username ? `@${s.account.username}` : "—")}
                                  </div>
                                </div>
                              </div>
                            ) : s.userId ? (
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                                  <Users className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-foreground truncate max-w-[140px]">
                                    {s.userDisplay || `User ${s.userId.slice(-6)}`}
                                  </div>
                                  <div className="text-[10px] font-mono text-muted-foreground">
                                    UID: {s.userId.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 font-bold text-xs shrink-0">
                                  <Users className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-foreground">
                                    Khách vãng lai
                                  </div>
                                  <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[130px]">
                                    {s.anonymousId ? `Anon: ${s.anonymousId.slice(0, 8)}...` : `Phiên: ${s.sessionId.slice(0, 8)}...`}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Type (Guest vs Authenticated) */}
                          <td className="py-3 px-4">
                            {s.userType === "authenticated" ? (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-400 rounded-xs">
                                Thành viên
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-400 rounded-xs">
                                Khách vãng lai
                              </span>
                            )}
                          </td>

                          {/* User ID */}
                          <td className="py-3 px-4 font-mono">
                            {s.userId ? (
                              <span className="px-1.5 py-0.5 text-[11px] bg-muted/40 border border-border text-foreground" title={s.userId}>
                                {s.userId.slice(0, 10)}...
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">—</span>
                            )}
                          </td>

                          {/* Role */}
                          <td className="py-3 px-4">
                            {(s.account?.role === "admin" || s.userRole === "admin") ? (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 rounded-xs">
                                Admin
                              </span>
                            ) : s.userType === "authenticated" ? (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xs">
                                Khách hàng
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">Khách</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {renderStatusBadge(s.overallStatus, s.idleDurationSec)}
                          </td>

                          {/* Current Route */}
                          <td className="py-3 px-4 font-mono font-medium text-foreground">
                            {s.currentRoute || "/"}
                          </td>

                          {/* Last Action */}
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <span className="px-1.5 py-0.5 bg-muted/40 border border-border">
                              {s.lastAction}
                            </span>
                          </td>

                          {/* Session Duration */}
                          <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                            {formatDurationNice(s.sessionDurationSec)}
                          </td>

                          {/* Action CTA */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              data-testid="open-journey-btn"
                              data-session-id={s.sessionId}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTimeline(s.sessionId);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-text)] underline group-hover:translate-x-0.5 transition-transform"
                            >
                              Hành trình <ChevronRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            );
          })()}
          </AdminCard>
        </div>
      )}

      {/* TAB 2: PAGE DURATION ANALYTICS */}
      {activeTab === "pages" && (
        <div className="space-y-4">
          <AdminCard className="p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-1">
              Thời Gian Dừng & Tương Tác Thực Tế Trên Từng Trang
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Phân tách rạch ròi giữa Dwell Time (tổng thời gian mở trang), Active Time (thực sự thao tác) và Idle Time (không bấm/cuộn)
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20 font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Đường Dẫn Trang (Route)</th>
                    <th className="py-3 px-4 text-right">Lượt Xem (Views)</th>
                    <th className="py-3 px-4 text-right">Dwell Time TB</th>
                    <th className="py-3 px-4 text-right">Active Time TB</th>
                    <th className="py-3 px-4 text-right">Tỷ Lệ Tương Tác</th>
                    <th className="py-3 px-4 text-right">Idle Time TB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analyticsData.pageAnalytics.map((page) => {
                    const activeRatio =
                      page.avgDwellSec > 0
                        ? Math.min(100, Math.round((page.avgActiveSec / page.avgDwellSec) * 100))
                        : 0;
                    return (
                      <tr key={page.pathname} className="hover:bg-muted/10">
                        <td className="py-3 px-4 font-mono font-semibold text-foreground">
                          {page.pathname}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">{page.views}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium">
                          {formatDurationNice(page.avgDwellSec)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatDurationNice(page.avgActiveSec)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span
                            className={`px-2 py-0.5 font-bold ${
                              activeRatio >= 50
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {activeRatio}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                          {formatDurationNice(page.avgIdleSec)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AdminCard>
        </div>
      )}

      {/* TAB 3: API OBSERVABILITY */}
      {activeTab === "api" && (
        <div className="space-y-4">
          <AdminCard className="p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-1">
              Hiệu Năng & Độ Tin Cậy Của API (API Observability)
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Theo dõi thời gian phản hồi, phát hiện các yêu cầu chậm (&gt; 5s) và nghi vấn treo (&gt; 15s) được tương quan với hành động người dùng
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20 font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Endpoint</th>
                    <th className="py-3 px-4 text-right">Số Yêu Cầu</th>
                    <th className="py-3 px-4 text-right">Độ Trễ TB</th>
                    <th className="py-3 px-4 text-right">Yêu Cầu Chậm (&gt; 5s)</th>
                    <th className="py-3 px-4 text-right">Số Lỗi (4xx/5xx)</th>
                    <th className="py-3 px-4 text-right">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analyticsData.apiMetrics.map((api) => {
                    const isSlow = api.slowCount > 0 || api.avgLatencyMs > 2000;
                    const hasErrors = api.errorCount > 0;
                    return (
                      <tr key={api.endpoint} className="hover:bg-muted/10">
                        <td className="py-3 px-4 font-mono font-semibold text-foreground">
                          {api.endpoint}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">{api.count}</td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span
                            className={
                              api.avgLatencyMs > 1000
                                ? "text-amber-600 font-bold"
                                : "text-emerald-600 font-semibold"
                            }
                          >
                            {api.avgLatencyMs} ms
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {api.slowCount > 0 ? (
                            <span className="text-rose-600 font-bold px-1.5 py-0.5 bg-rose-500/10">
                              {api.slowCount}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {api.errorCount > 0 ? (
                            <span className="text-rose-600 font-bold px-1.5 py-0.5 bg-rose-500/10">
                              {api.errorCount}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {hasErrors ? (
                            <span className="px-2 py-0.5 text-[10px] bg-rose-500/10 text-rose-600 font-bold uppercase">
                              Lỗi
                            </span>
                          ) : isSlow ? (
                            <span className="px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-600 font-bold uppercase">
                              Chậm
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-600 font-bold uppercase">
                              Ổn định
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AdminCard>
        </div>
      )}

      {/* TAB 4: ACQUISITION & CHECKOUT FUNNEL */}
      {activeTab === "acquisition" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traffic Sources */}
          <AdminCard className="p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-2">
              Nguồn Truy Cập (Traffic Sources)
            </h3>
            <div className="space-y-3 mt-4">
              {analyticsData.trafficSources.map((s) => (
                <div key={s.source} className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{s.source}</span>
                  <span className="font-mono bg-muted px-2 py-0.5">{s.count} lượt</span>
                </div>
              ))}
            </div>
          </AdminCard>

          {/* Checkout & Inventory Reservation Flow */}
          <AdminCard className="p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-2">
              Phễu Mua Hàng & Giữ Hàng (Inventory Reservation 300s)
            </h3>
            <div className="space-y-3 mt-4 text-xs font-mono">
              <div className="flex justify-between border-b pb-2">
                <span>Thêm Giỏ Hàng (add_to_cart)</span>
                <span className="font-bold">{analyticsData.checkoutFunnel.add_to_cart || 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span>Bắt Đầu Checkout (checkout_started)</span>
                <span className="font-bold">{analyticsData.checkoutFunnel.checkout_started || 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-sky-600 font-semibold">
                <span>Giữ Hàng Redis 300s (reservation_created)</span>
                <span className="font-bold">{analyticsData.checkoutFunnel.reservation_created || 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-emerald-600 font-semibold">
                <span>Đặt Hàng Thành Công (order_placed)</span>
                <span className="font-bold">{analyticsData.checkoutFunnel.order_placed || 0}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Bỏ Dở Thanh Toán (checkout_abandoned)</span>
                <span className="font-bold">{analyticsData.checkoutFunnel.checkout_abandoned || 0}</span>
              </div>
            </div>
          </AdminCard>
        </div>
      )}

      {/* 5. USER JOURNEY TIMELINE DRAWER */}
      <SessionJourneyDrawer
        isOpen={Boolean(selectedSessionId)}
        onClose={handleCloseTimeline}
        sessionId={selectedSessionId}
        sessionDetail={sessionDetail}
        sessionSummary={liveData.sessions.find((s) => s.sessionId === selectedSessionId)}
        loading={timelineLoading}
        error={timelineError}
        socket={socketInstance}
        onRefresh={() => fetchSessionTimeline(selectedSessionId)}
      />
    </div>
  );
};

export default UserActivityMonitoring;
