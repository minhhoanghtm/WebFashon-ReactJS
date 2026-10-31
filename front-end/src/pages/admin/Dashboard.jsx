import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import {
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  ArrowRight,
  TrendingUp,
  Ticket,
  Percent,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Activity,
  Filter,
  Eye,
  Bot,
} from "lucide-react";
import {
  DashboardApi,
  getRevenueOverviewApi,
  getAdminOrdersApi,
} from "@/api/orderApi";
import { getAllProductApi } from "@/api/productApi";
import voucherApi from "@/api/voucher.api";
import trackingApi from "@/api/trackingApi";
import { formatCurrency } from "@/utils/format";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import {
  AdminPageHeader,
  AdminCard,
  AdminBadge,
  KPISkeleton,
  TableSkeleton,
} from "@/components/admin/ui";

const Dashboard = () => {
  const { settings } = useWebsiteSettings();
  const brandName = settings?.general?.siteName || "WebFashion";

  const [range, setRange] = useState("last7days");
  const [activeView, setActiveView] = useState("sales"); // 'sales' | 'vouchers' | 'behavior'

  // Sales States
  const [loadingSales, setLoadingSales] = useState(true);
  const [salesError, setSalesError] = useState(null);
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalCustomers: 0,
    totalSoldProducts: 0,
  });
  const [totalProducts, setTotalProducts] = useState(0);
  const [revenueOverview, setRevenueOverview] = useState([]);
  const [recentOrdersList, setRecentOrdersList] = useState([]);

  // Voucher States
  const [voucherStats, setVoucherStats] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Tracking & Funnel States
  const [trackingOverview, setTrackingOverview] = useState(null);
  const [funnelData, setFunnelData] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);

  const fetchSalesData = useCallback(async () => {
    await Promise.resolve();
    try {
      setLoadingSales(true);
      setSalesError(null);

      const typeMap = {
        last7days: "week",
        last30days: "month",
        last1year: "year",
      };
      const type = typeMap[range] || "week";

      const [kpiRes, revenueRes, ordersRes, productsRes] = await Promise.all([
        DashboardApi().catch(() => null),
        getRevenueOverviewApi(type).catch(() => null),
        getAdminOrdersApi({ limit: 5 }).catch(() => null),
        getAllProductApi().catch(() => null),
      ]);

      const kpiData = kpiRes?.data?.data || kpiRes?.data || {};
      const revenueData = revenueRes?.data?.data || revenueRes?.data || [];
      const ordersData = ordersRes?.data?.data || ordersRes?.data || {};
      const productsData = productsRes?.data?.data || productsRes?.data || [];

      setKpis({
        totalRevenue: kpiData.totalRevenue || 0,
        totalOrders: kpiData.totalOrders || 0,
        avgOrderValue: kpiData.avgOrderValue || 0,
        totalCustomers: kpiData.totalCustomers || 0,
        totalSoldProducts: kpiData.totalSoldProducts || 0,
      });

      setRevenueOverview(Array.isArray(revenueData) ? revenueData : []);
      setRecentOrdersList(Array.isArray(ordersData?.items) ? ordersData.items : Array.isArray(ordersData) ? ordersData : []);
      setTotalProducts(Array.isArray(productsData) ? productsData.length : 0);
    } catch (err) {
      setSalesError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải dữ liệu thống kê."
      );
    } finally {
      setLoadingSales(false);
    }
  }, [range]);

  useEffect(() => {
    if (activeView === "sales") {
      fetchSalesData();
    }
  }, [fetchSalesData, activeView]);

  const fetchTrackingData = useCallback(async () => {
    await Promise.resolve();
    try {
      setLoadingTracking(true);
      setTrackingError(null);
      const [overviewRes, funnelRes] = await Promise.all([
        trackingApi.getAnalyticsOverview({ range }).catch(() => null),
        trackingApi.getFunnelAnalytics({ range }).catch(() => null),
      ]);
      setTrackingOverview(overviewRes?.data?.data || overviewRes?.data || null);
      setFunnelData(funnelRes?.data?.data || funnelRes?.data || null);
    } catch (err) {
      setTrackingError(
        err?.response?.data?.message || "Không thể tải dữ liệu phân tích hành vi."
      );
    } finally {
      setLoadingTracking(false);
    }
  }, [range]);

  useEffect(() => {
    if (activeView === "behavior") {
      fetchTrackingData();
    }
  }, [fetchTrackingData, activeView]);

  const fetchVoucherStats = useCallback(async () => {
    await Promise.resolve();
    try {
      setVoucherLoading(true);
      const res = await voucherApi.getAdminVouchersStats().catch(() => null);
      if (res?.success || res?.data) {
        setVoucherStats(res?.data || res);
      }
    } catch {
      // silent fallback
    } finally {
      setVoucherLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeView === "vouchers" && !voucherStats) {
      fetchVoucherStats();
    }
  }, [activeView, voucherStats, fetchVoucherStats]);

  const handleRefresh = () => {
    if (activeView === "sales") {
      fetchSalesData();
    } else if (activeView === "vouchers") {
      fetchVoucherStats();
    } else {
      fetchTrackingData();
    }
  };

  const getStatusBadge = (status) => {
    const key = (status || "").toUpperCase();
    switch (key) {
      case "PENDING":
        return (
          <AdminBadge variant="warning" dot size="sm">
            Chờ xác nhận
          </AdminBadge>
        );
      case "CONFIRMED":
        return (
          <AdminBadge variant="info" dot size="sm">
            Đã xác nhận
          </AdminBadge>
        );
      case "PACKING":
      case "PROCESSING":
        return (
          <AdminBadge variant="info" dot size="sm">
            Đang đóng gói
          </AdminBadge>
        );
      case "SHIPPING":
        return (
          <AdminBadge variant="brand" dot size="sm">
            Đang giao
          </AdminBadge>
        );
      case "COMPLETED":
      case "DELIVERED":
        return (
          <AdminBadge variant="success" dot size="sm">
            Hoàn thành
          </AdminBadge>
        );
      case "CANCELLED":
        return (
          <AdminBadge variant="danger" dot size="sm">
            Đã hủy
          </AdminBadge>
        );
      default:
        return (
          <AdminBadge variant="neutral" size="sm">
            {status || "Khác"}
          </AdminBadge>
        );
    }
  };

  // Monochrome ECharts Options — Sales
  const salesChartOptions = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#0C0C0E",
      borderColor: "#27272A",
      textStyle: { color: "#F7F6F2", fontSize: 12 },
      formatter: (params) => {
        const item = params?.[0];
        if (!item) return "";
        return `<div style="font-weight:600;margin-bottom:4px">${item.name}</div>
                <div>Doanh thu: <b>${formatCurrency(item.value)}</b></div>`;
      },
    },
    grid: {
      left: "2%",
      right: "2%",
      bottom: "4%",
      top: "8%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: revenueOverview.map((item) => item.label),
      axisLine: { lineStyle: { color: "#D4D4D8" } },
      axisLabel: { color: "#71717A", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#E4E4E7", type: "dashed" } },
      axisLabel: {
        color: "#71717A",
        fontSize: 11,
        formatter: (val) => {
          if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
          if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
          return val;
        },
      },
    },
    series: [
      {
        name: "Doanh thu",
        data: revenueOverview.map((item) => item.revenue),
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        itemStyle: { color: "#18181B" },
        lineStyle: { width: 2.5, color: "#18181B" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(24, 24, 27, 0.22)" },
              { offset: 1, color: "rgba(24, 24, 27, 0.0)" },
            ],
          },
        },
      },
    ],
  };

  // Monochrome ECharts Options — Conversion Funnel
  const funnelStages = funnelData?.funnel || [];
  const funnelChartOptions = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#0C0C0E",
      borderColor: "#27272A",
      textStyle: { color: "#F7F6F2", fontSize: 12 },
    },
    legend: {
      data: ["Số phiên (Sessions)", "Người dùng (Users)"],
      bottom: 0,
      textStyle: { color: "#71717A", fontSize: 11 },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "14%",
      top: "6%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: funnelStages.map((s) => s.label),
      axisLabel: { color: "#71717A", fontSize: 11, interval: 0 },
      axisLine: { lineStyle: { color: "#D4D4D8" } },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#E4E4E7", type: "dashed" } },
      axisLabel: { color: "#71717A", fontSize: 11 },
    },
    series: [
      {
        name: "Số phiên (Sessions)",
        type: "bar",
        barMaxWidth: 34,
        itemStyle: { color: "#18181B" },
        data: funnelStages.map((s) => s.uniqueSessions || 0),
      },
      {
        name: "Người dùng (Users)",
        type: "bar",
        barMaxWidth: 34,
        itemStyle: { color: "#71717A" },
        data: funnelStages.map((s) => s.uniqueUsers || 0),
      },
    ],
  };

  // Monochrome ECharts Options — Vouchers
  const voucherChartOptions = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#0C0C0E",
      borderColor: "#27272A",
      textStyle: { color: "#F7F6F2", fontSize: 12 },
    },
    legend: {
      data: ["Lượt Nhận (Claim)", "Lượt Sử Dụng"],
      bottom: 0,
      textStyle: { color: "#71717A", fontSize: 11 },
    },
    grid: {
      left: "2%",
      right: "2%",
      bottom: "12%",
      top: "8%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: voucherStats?.charts?.dates || [],
      axisLine: { lineStyle: { color: "#D4D4D8" } },
      axisLabel: { color: "#71717A", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#E4E4E7", type: "dashed" } },
      axisLabel: { color: "#71717A", fontSize: 11 },
    },
    series: [
      {
        name: "Lượt Nhận (Claim)",
        type: "line",
        smooth: true,
        itemStyle: { color: "#71717A" },
        lineStyle: { width: 2, color: "#71717A", type: "dashed" },
        data: voucherStats?.charts?.claims || [],
      },
      {
        name: "Lượt Sử Dụng",
        type: "line",
        smooth: true,
        itemStyle: { color: "#18181B" },
        lineStyle: { width: 2.5, color: "#18181B" },
        data: voucherStats?.charts?.usages || [],
      },
    ],
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <AdminPageHeader
        title="Tổng quan hoạt động"
        description={`Theo dõi doanh số, đơn hàng và các chỉ số kinh doanh thực tế của ${brandName}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* View Tabs */}
            <div
              role="tablist"
              aria-label="Chế độ xem thống kê"
              className="inline-flex border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
            >
              {[
                { id: "sales", label: "Bán hàng" },
                { id: "vouchers", label: "Khuyến mãi" },
                { id: "behavior", label: "Hành vi & Phễu" },
              ].map((tab) => {
                const active = activeView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveView(tab.id)}
                    className={`touch-target px-3.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                      active
                        ? "bg-[var(--color-text)] text-[var(--color-bg)]"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Làm mới dữ liệu thống kê"
              title="Làm mới dữ liệu"
              className="touch-target inline-flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] transition-colors hover:border-[var(--color-text)]"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        }
      />

      {/* Main Content Area */}
      {activeView === "sales" ? (
        loadingSales ? (
          <div className="space-y-6">
            <KPISkeleton />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="h-80 animate-pulse border border-[var(--color-border)] bg-[var(--color-surface)] lg:col-span-2" />
              <div className="h-80 animate-pulse border border-[var(--color-border)] bg-[var(--color-surface)]" />
            </div>
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : salesError ? (
          <div
            role="alert"
            aria-live="polite"
            className="mx-auto my-12 max-w-md space-y-4 border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/5 p-8 text-center"
          >
            <AlertCircle className="mx-auto h-10 w-10 text-[var(--color-danger)]" />
            <h3 className="font-serif text-lg font-medium text-[var(--color-text)]">
              Lỗi nạp dữ liệu thống kê
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              {salesError}
            </p>
            <button
              type="button"
              onClick={fetchSalesData}
              className="touch-target inline-flex items-center justify-center bg-[var(--color-text)] px-6 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-bg)] transition-opacity hover:opacity-90"
            >
              Thử tải lại
            </button>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-text)]">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Tổng doanh thu
                  </span>
                  <div className="font-serif text-2xl font-semibold tracking-tight text-[var(--color-text)] tabular-nums">
                    {formatCurrency(kpis.totalRevenue)}
                  </div>
                  <span className="inline-flex text-[11px] text-[var(--color-text-muted)]">
                    Từ các đơn hoàn tất
                  </span>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--color-text)] text-[var(--color-bg)]">
                  <CreditCard className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </div>

              <div className="flex items-center justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-text)]">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Đơn hàng hoàn tất
                  </span>
                  <div className="font-serif text-2xl font-semibold tracking-tight text-[var(--color-text)] tabular-nums">
                    {kpis.totalOrders}
                  </div>
                  <span className="inline-flex text-[11px] text-[var(--color-text-muted)]">
                    Giao dịch thành công
                  </span>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]">
                  <ShoppingCart className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </div>

              <div className="flex items-center justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-text)]">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Sản phẩm đang bán
                  </span>
                  <div className="font-serif text-2xl font-semibold tracking-tight text-[var(--color-text)] tabular-nums">
                    {totalProducts}
                  </div>
                  <span className="inline-flex text-[11px] text-[var(--color-text-muted)]">
                    Trong toàn danh mục
                  </span>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]">
                  <Package className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </div>

              <div className="flex items-center justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-text)]">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Khách hàng mua sắm
                  </span>
                  <div className="font-serif text-2xl font-semibold tracking-tight text-[var(--color-text)] tabular-nums">
                    {kpis.totalCustomers}
                  </div>
                  <span className="inline-flex text-[11px] text-[var(--color-text-muted)]">
                    Đã phát sinh đơn
                  </span>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]">
                  <Users className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* Graphs & Quick Analytics */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Sales Chart */}
              <AdminCard
                className="lg:col-span-2"
                title="Biểu đồ doanh thu"
                subtitle="Số liệu doanh số tích lũy theo chu kỳ thời gian thực"
                extra={
                  <div>
                    <label htmlFor="dashboard-range-select" className="sr-only">
                      Chọn khoảng thời gian
                    </label>
                    <select
                      id="dashboard-range-select"
                      value={range}
                      onChange={(e) => setRange(e.target.value)}
                      className="touch-target border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-xs font-semibold text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none"
                    >
                      <option value="last7days">7 ngày qua</option>
                      <option value="last30days">30 ngày qua</option>
                      <option value="last1year">1 năm qua</option>
                    </select>
                  </div>
                }
              >
                {revenueOverview.length === 0 ? (
                  <div className="flex h-[280px] items-center justify-center text-xs text-[var(--color-text-muted)]">
                    Chưa có phát sinh doanh thu trong khoảng thời gian này.
                  </div>
                ) : (
                  <ReactECharts
                    option={salesChartOptions}
                    style={{ height: "280px", width: "100%" }}
                  />
                )}
              </AdminCard>

              {/* Quick Summary Panel */}
              <AdminCard
                title="Chỉ số hiệu suất"
                subtitle="Đo lường trung bình hoạt động bán lẻ"
              >
                <div className="space-y-4">
                  <div className="border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                      Giá trị đơn hàng trung bình (AOV)
                    </div>
                    <div className="mt-1 font-serif text-xl font-semibold text-[var(--color-text)] tabular-nums">
                      {formatCurrency(kpis.avgOrderValue)}
                    </div>
                  </div>

                  <div className="border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                      Tổng sản phẩm đã tiêu thụ
                    </div>
                    <div className="mt-1 font-serif text-xl font-semibold text-[var(--color-text)] tabular-nums">
                      {kpis.totalSoldProducts}{" "}
                      <span className="font-sans text-xs font-normal text-[var(--color-text-muted)]">
                        sản phẩm
                      </span>
                    </div>
                  </div>

                  <div className="border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                      Khách hàng hoạt động
                    </div>
                    <div className="mt-1 font-serif text-xl font-semibold text-[var(--color-text)] tabular-nums">
                      {kpis.totalCustomers}{" "}
                      <span className="font-sans text-xs font-normal text-[var(--color-text-muted)]">
                        tài khoản
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs font-medium text-[var(--color-text-muted)]">
                    <TrendingUp className="h-4 w-4 text-[var(--color-text)]" />
                    <span>Tự động đồng bộ từ đơn hàng hệ thống</span>
                  </div>
                </div>
              </AdminCard>
            </div>

            {/* Recent Orders Card */}
            <AdminCard
              title="Đơn hàng gần đây"
              subtitle="5 đơn hàng mới nhất cần quản lý và xử lý"
              extra={
                <Link
                  to="/admin/orders"
                  className="touch-target inline-flex items-center gap-1.5 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text)] transition-colors hover:border-[var(--color-text)]"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
              noPadding
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--color-border)] text-left text-xs">
                  <thead className="bg-[var(--color-bg)] text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                    <tr>
                      <th className="px-6 py-3.5">Mã đơn hàng</th>
                      <th className="px-6 py-3.5">Khách hàng</th>
                      <th className="px-6 py-3.5">Tổng tiền</th>
                      <th className="px-6 py-3.5">Trạng thái</th>
                      <th className="px-6 py-3.5">Ngày đặt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] font-medium">
                    {recentOrdersList.length > 0 ? (
                      recentOrdersList.map((order) => (
                        <tr
                          key={order._id}
                          className="transition-colors hover:bg-[var(--color-bg)]/60"
                        >
                          <td className="px-6 py-3.5 font-mono font-semibold text-[var(--color-text)]">
                            <Link
                              to="/admin/orders"
                              className="underline-offset-4 hover:underline"
                            >
                              #{order._id.slice(-6).toUpperCase()}
                            </Link>
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-[var(--color-text)]">
                            {order.shipping_address?.full_name ||
                              "Khách vãng lai"}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-[var(--color-text)] tabular-nums">
                            {formatCurrency(order.total_price || 0)}
                          </td>
                          <td className="px-6 py-3.5">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-3.5 text-[var(--color-text-muted)]">
                            {new Date(order.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-10 text-center text-[var(--color-text-muted)]"
                        >
                          Chưa ghi nhận đơn hàng nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </AdminCard>
          </>
        )
      ) : activeView === "vouchers" ? (
        voucherLoading ? (
          <div className="space-y-6">
            <KPISkeleton />
            <div className="h-80 animate-pulse border border-[var(--color-border)] bg-[var(--color-surface)]" />
          </div>
        ) : !voucherStats ? (
          <div className="flex flex-col items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] py-20 text-center">
            <AlertCircle className="mb-2 h-10 w-10 text-[var(--color-text-muted)]" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Chưa có dữ liệu thống kê Voucher
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Voucher KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Tổng mã giảm giá
                  </span>
                  <div className="font-serif text-2xl font-semibold text-[var(--color-text)] tabular-nums">
                    {voucherStats.stats?.totalVouchers || 0}
                  </div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]">
                  <Ticket className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </div>

              <div className="flex items-center justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Đang kích hoạt
                  </span>
                  <div className="font-serif text-2xl font-semibold text-[var(--color-text)] tabular-nums">
                    {voucherStats.stats?.activeVouchers || 0}
                  </div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--color-text)] text-[var(--color-bg)]">
                  <Percent className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </div>

              <div className="flex items-center justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Voucher hết hạn
                  </span>
                  <div className="font-serif text-2xl font-semibold text-[var(--color-danger)] tabular-nums">
                    {voucherStats.stats?.expiredVouchers || 0}
                  </div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
                  <AlertCircle className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </div>

              <div className="flex items-center justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Đã dùng hết quota
                  </span>
                  <div className="font-serif text-2xl font-semibold text-[var(--color-text)] tabular-nums">
                    {voucherStats.stats?.soldOutVouchers || 0}
                  </div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]">
                  <Sparkles className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* Voucher Charts & Top Performers */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <AdminCard
                className="lg:col-span-2"
                title="Tương tác Voucher"
                subtitle="Lượt nhận (Claim) và lượt áp dụng thực tế (Usage)"
              >
                <ReactECharts
                  option={voucherChartOptions}
                  style={{ height: "280px", width: "100%" }}
                />
              </AdminCard>

              <AdminCard
                title="Top Voucher hiệu quả"
                subtitle="Theo tỷ lệ sử dụng cao nhất"
              >
                {!voucherStats.topVouchers ||
                voucherStats.topVouchers.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
                    Chưa có lượt sử dụng nào
                  </div>
                ) : (
                  <div className="space-y-4">
                    {voucherStats.topVouchers.map((v, idx) => {
                      const usageRatio = Math.min(
                        100,
                        Math.round(
                          (v.usedQuantity / (v.totalQuantity || 1)) * 100
                        )
                      );
                      return (
                        <div key={v.code} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="font-mono font-bold text-[var(--color-text)]">
                              {idx + 1}. {v.code}
                            </span>
                            <span className="text-[var(--color-text-muted)] tabular-nums">
                              {v.usedQuantity}/{v.totalQuantity} ({usageRatio}%)
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden bg-[var(--color-bg)]">
                            <div
                              className="h-full bg-[var(--color-text)] transition-all"
                              style={{ width: `${usageRatio}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </AdminCard>
            </div>
          </div>
        )
      ) : loadingTracking ? (
        <div className="space-y-6">
          <KPISkeleton />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="h-80 animate-pulse border border-[var(--color-border)] bg-[var(--color-surface)] lg:col-span-2" />
            <div className="h-80 animate-pulse border border-[var(--color-border)] bg-[var(--color-surface)]" />
          </div>
          <TableSkeleton rows={5} cols={5} />
        </div>
      ) : trackingError ? (
        <AdminCard>
          <div
            role="alert"
            aria-live="polite"
            className="space-y-3 p-8 text-center"
          >
            <AlertCircle className="mx-auto h-10 w-10 text-[var(--color-danger)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              {trackingError}
            </h3>
            <button
              type="button"
              onClick={fetchTrackingData}
              className="touch-target inline-flex items-center justify-center bg-[var(--color-text)] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-bg)] transition-opacity hover:opacity-90"
            >
              Thử lại
            </button>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-6">
          {/* Behavioral KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminCard>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Tổng sự kiện ghi nhận
                </span>
                <div className="flex h-9 w-9 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]">
                  <Activity className="h-4 w-4" strokeWidth={1.5} />
                </div>
              </div>
              <div className="mt-4">
                <div className="font-serif text-2xl font-semibold text-[var(--color-text)] tabular-nums">
                  {(trackingOverview?.totalEvents || 0).toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {trackingOverview?.activeUsersCount || 0} user ·{" "}
                  {trackingOverview?.activeSessionsCount || 0} phiên
                </div>
              </div>
            </AdminCard>

            <AdminCard>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Gợi ý sản phẩm (CTR)
                </span>
                <div className="flex h-9 w-9 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]">
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                </div>
              </div>
              <div className="mt-4">
                <div className="font-serif text-2xl font-semibold text-[var(--color-text)] tabular-nums">
                  {trackingOverview?.recommendationMetrics?.ctrPercentage || 0}%
                </div>
                <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {trackingOverview?.recommendationMetrics?.clicks || 0} click /{" "}
                  {trackingOverview?.recommendationMetrics?.impressions || 0}{" "}
                  hiển thị
                </div>
              </div>
            </AdminCard>

            <AdminCard>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Tương tác AI Chat
                </span>
                <div className="flex h-9 w-9 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]">
                  <Bot className="h-4 w-4" strokeWidth={1.5} />
                </div>
              </div>
              <div className="mt-4">
                <div className="font-serif text-2xl font-semibold text-[var(--color-text)] tabular-nums">
                  {trackingOverview?.aiMetrics?.ctrPercentage || 0}% CTR
                </div>
                <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {trackingOverview?.aiMetrics?.cartActionConfirmedCount || 0}{" "}
                  xác nhận giỏ qua AI
                </div>
              </div>
            </AdminCard>

            <AdminCard>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Chuyển đổi mua hàng (Funnel)
                </span>
                <div className="flex h-9 w-9 items-center justify-center bg-[var(--color-text)] text-[var(--color-bg)]">
                  <Filter className="h-4 w-4" strokeWidth={1.5} />
                </div>
              </div>
              <div className="mt-4">
                <div className="font-serif text-2xl font-semibold text-[var(--color-text)] tabular-nums">
                  {funnelData?.funnel?.[funnelData?.funnel?.length - 1]
                    ?.overallConversionRate || 0}
                  %
                </div>
                <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {funnelData?.funnel?.[funnelData?.funnel?.length - 1]
                    ?.uniqueUsers || 0}{" "}
                  khách hoàn tất mua
                </div>
              </div>
            </AdminCard>
          </div>

          {/* Conversion Funnel Visualization & Stage Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <AdminCard
              className="lg:col-span-2"
              title="Phễu chuyển đổi hành vi (Conversion Funnel)"
              subtitle="Tỷ lệ giữ chân người dùng qua từng giai đoạn mua sắm"
            >
              <ReactECharts
                option={funnelChartOptions}
                style={{ height: "320px", width: "100%" }}
              />

              {/* Funnel Stage Breakdown Table */}
              <div className="mt-4 overflow-x-auto border-t border-[var(--color-border)] pt-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                      <th className="py-2">Giai đoạn</th>
                      <th className="py-2 text-right">Số phiên</th>
                      <th className="py-2 text-right">Khách duy nhất</th>
                      <th className="py-2 text-right">Chuyển tiếp bước</th>
                      <th className="py-2 text-right">Tỷ lệ rớt (Drop)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {(funnelData?.funnel || []).map((stg) => (
                      <tr
                        key={stg.stage}
                        className="hover:bg-[var(--color-bg)]/60"
                      >
                        <td className="py-2.5 font-semibold text-[var(--color-text)]">
                          {stg.label}
                        </td>
                        <td className="py-2.5 text-right text-[var(--color-text-muted)] tabular-nums">
                          {(stg.uniqueSessions || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-[var(--color-text-muted)] tabular-nums">
                          {(stg.uniqueUsers || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-bold text-[var(--color-text)] tabular-nums">
                          {stg.stepConversionRate || 0}%
                        </td>
                        <td className="py-2.5 text-right font-semibold text-[var(--color-danger)] tabular-nums">
                          {stg.dropOffRate || 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminCard>

            {/* Side Panels: Top Products & Search Keywords */}
            <div className="space-y-6">
              <AdminCard
                title="Sản phẩm xem nhiều nhất"
                subtitle="Top 5 sản phẩm thu hút chú ý"
              >
                {!trackingOverview?.topViewedProducts ||
                trackingOverview.topViewedProducts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                    Chưa có lượt xem nào
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {trackingOverview.topViewedProducts
                      .slice(0, 5)
                      .map((p, idx) => (
                        <div
                          key={p._id}
                          className="flex items-center gap-3 border border-transparent p-2 transition-colors hover:border-[var(--color-border)] hover:bg-[var(--color-bg)]"
                        >
                          <span className="w-5 text-center text-xs font-bold text-[var(--color-text-muted)]">
                            #{idx + 1}
                          </span>
                          {p.image && (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-10 w-10 border border-[var(--color-border)] object-cover"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-xs font-semibold text-[var(--color-text)]">
                              {p.name}
                            </h4>
                            <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                              {formatCurrency(p.price)}
                            </span>
                          </div>
                          <span className="border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-0.5 text-xs font-bold text-[var(--color-text)] tabular-nums">
                            {p.views} xem
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </AdminCard>

              <AdminCard
                title="Từ khóa tìm kiếm phổ biến"
                subtitle="Xu hướng người dùng đang tìm kiếm"
              >
                {!trackingOverview?.topSearches ||
                trackingOverview.topSearches.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                    Chưa có dữ liệu tìm kiếm
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {trackingOverview.topSearches.slice(0, 8).map((s) => (
                      <span
                        key={s.query}
                        className="inline-flex items-center gap-1.5 border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1 text-xs font-medium text-[var(--color-text)]"
                      >
                        <span>{s.query}</span>
                        <span className="border-l border-[var(--color-border)] pl-1.5 text-[10px] font-bold text-[var(--color-text-muted)]">
                          {s.count}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </AdminCard>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
