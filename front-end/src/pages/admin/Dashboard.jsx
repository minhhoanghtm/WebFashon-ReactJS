import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShoppingCart,
  Package,
  Users,
  Ticket,
  Percent,
  Sparkles,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  Activity,
  Eye,
  MousePointerClick,
  Filter,
  Search,
  BarChart3,
  Bot,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { toast } from 'react-toastify';
import voucherApi from '../../api/voucher.api';
import trackingApi from '@/api/trackingApi';
import {
  DashboardService,
  getRevenueOverviewService,
  getAdminOrdersService,
} from '@/services/order.service';
import { getAllProductService } from '@/services/product.service';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  AdminPageHeader,
  AdminCard,
  AdminBadge,
  KPISkeleton,
  TableSkeleton,
} from '@/components/admin/ui';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(val || 0);
};

const getStatusBadge = (status) => {
  const map = {
    pending: { label: 'Chờ xử lý', variant: 'warning' },
    confirmed: { label: 'Đã xác nhận', variant: 'info' },
    shipping: { label: 'Đang giao', variant: 'info' },
    shipped: { label: 'Đang giao', variant: 'info' },
    delivered: { label: 'Đã giao', variant: 'success' },
    cancelled: { label: 'Đã hủy', variant: 'danger' },
  };

  const item = map[status] || { label: status || 'Không rõ', variant: 'neutral' };
  return (
    <AdminBadge variant={item.variant} dot size="sm">
      {item.label}
    </AdminBadge>
  );
};

const Dashboard = () => {
  useDocumentTitle('Tổng quan — 404Studio Admin');
  const [activeView, setActiveView] = useState('sales'); // 'sales' | 'vouchers'
  const [range, setRange] = useState('last7days');

  // Voucher states
  const [voucherStats, setVoucherStats] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Sales states
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalSoldProducts: 0,
    avgOrderValue: 0,
  });
  const [totalProducts, setTotalProducts] = useState(0);
  const [revenueOverview, setRevenueOverview] = useState([]);
  const [recentOrdersList, setRecentOrdersList] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [salesError, setSalesError] = useState(null);

  // Tracking & Behavioral states
  const [trackingOverview, setTrackingOverview] = useState(null);
  const [funnelData, setFunnelData] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);

  const fetchTrackingData = async () => {
    try {
      setLoadingTracking(true);
      setTrackingError(null);
      const [overviewRes, funnelRes] = await Promise.all([
        trackingApi.getAnalyticsOverview(),
        trackingApi.getFunnelAnalytics(),
      ]);
      if (overviewRes?.data) setTrackingOverview(overviewRes.data);
      if (funnelRes?.data) setFunnelData(funnelRes.data);
    } catch (err) {
      console.error('Fetch tracking analytics error:', err);
      setTrackingError('Không thể tải dữ liệu phân tích hành vi từ máy chủ.');
    } finally {
      setLoadingTracking(false);
    }
  };

  const fetchSalesData = async () => {
    try {
      setLoadingSales(true);
      setSalesError(null);

      const typeMap = {
        last7days: 'week',
        last30days: 'month',
        last1year: 'year',
      };
      const type = typeMap[range] || 'week';

      const [kpiData, revenueData, ordersData, productsList] = await Promise.all([
        DashboardService(),
        getRevenueOverviewService(type),
        getAdminOrdersService({ limit: 5 }),
        getAllProductService(),
      ]);

      setKpis(
        kpiData || {
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalSoldProducts: 0,
          avgOrderValue: 0,
        }
      );
      setRevenueOverview(revenueData || []);
      setRecentOrdersList(ordersData?.items || []);
      setTotalProducts(productsList?.length || 0);
    } catch (err) {
      console.error('Fetch sales dashboard error:', err);
      setSalesError('Không thể tải báo cáo số liệu bán hàng từ máy chủ.');
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    if (activeView === 'sales') {
      fetchSalesData();
    }
  }, [activeView, range]);

  useEffect(() => {
    if (activeView === 'vouchers') {
      const fetchVoucherStats = async () => {
        try {
          setVoucherLoading(true);
          const res = await voucherApi.getAdminVouchersStats();
          if (res.success) {
            setVoucherStats(res.data);
          }
        } catch {
          toast.error('Không thể tải thống kê voucher');
        } finally {
          setVoucherLoading(false);
        }
      };
      fetchVoucherStats();
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'behavior') {
      fetchTrackingData();
    }
  }, [activeView]);

  const funnelChartOptions = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const item = params[0];
        const stages = funnelData?.funnel || [];
        const reversedStages = [...stages].reverse();
        const stage = reversedStages[item.dataIndex];
        return `
          <div style="font-weight: bold; padding-bottom: 4px;">${stage?.label || item.name}</div>
          <div>Lượt phiên: <b>${(stage?.uniqueSessions || 0).toLocaleString()}</b></div>
          <div>Người dùng duy nhất: <b>${(stage?.uniqueUsers || 0).toLocaleString()}</b></div>
          <div>Chuyển đổi tổng thể: <b style="color: #10B981;">${stage?.overallConversionRate || 0}%</b></div>
          <div>Chuyển tiếp bước: <b>${stage?.stepConversionRate || 0}%</b></div>
          <div>Rơi rụng (Drop-off): <b style="color: #F43F5E;">${stage?.dropOffRate || 0}%</b></div>
        `;
      },
    },
    grid: { left: '3%', right: '6%', top: '6%', bottom: '4%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}%', color: '#64748B', fontSize: 11 },
      max: 100,
      splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: (funnelData?.funnel || []).map((s) => s.label).reverse(),
      axisLabel: { color: '#64748B', fontSize: 11 },
      axisLine: { lineStyle: { color: '#E2E8F0' } },
    },
    series: [
      {
        name: 'Tỷ lệ chuyển đổi phễu',
        type: 'bar',
        barWidth: 16,
        data: (funnelData?.funnel || []).map((s) => s.overallConversionRate).reverse(),
        itemStyle: {
          color: (params) => {
            const colors = ['#10B981', '#059669', '#0D9488', '#0284C7', '#2563EB', '#05251C'];
            return colors[params.dataIndex % colors.length];
          },
          borderRadius: [0, 6, 6, 0],
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#05251C',
        },
      },
    ],
  };

  // ECharts Option for Sales Analytics (Terracotta & Slate palette)
  const salesChartOptions = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0F172A',
      borderColor: '#334155',
      textStyle: { color: '#F8FAFC', fontSize: 12 },
      valueFormatter: (value) => formatCurrency(value || 0),
    },
    grid: {
      left: '2%',
      right: '3%',
      top: '8%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: revenueOverview.map((item) => item.date),
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 11 },
      },
    ],
    yAxis: [
      {
        type: 'value',
        axisLine: { show: false },
        axisLabel: {
          color: '#64748B',
          fontSize: 11,
          formatter: (value) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
            return value;
          },
        },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
      },
    ],
    series: [
      {
        name: 'Doanh thu',
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbolSize: 6,
        data: revenueOverview.map((item) => item.revenue),
        itemStyle: { color: '#05251C' },
        lineStyle: { width: 2.5, color: '#05251C' },
        areaStyle: {
          opacity: 0.12,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#05251C' },
              { offset: 1, color: 'rgba(5, 37, 28, 0)' },
            ],
          },
        },
      },
    ],
  };

  // ECharts Option for Voucher Analytics
  const voucherChartOptions = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0F172A',
      borderColor: '#334155',
      textStyle: { color: '#F8FAFC', fontSize: 12 },
    },
    legend: {
      data: ['Lượt Nhận', 'Lượt Sử Dụng'],
      bottom: 0,
      textStyle: { color: '#64748B', fontSize: 12 },
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '8%',
      bottom: '12%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: voucherStats?.charts?.labels || [],
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 11 },
      },
    ],
    yAxis: [
      {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#64748B', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
      },
    ],
    series: [
      {
        name: 'Lượt Nhận',
        type: 'line',
        smooth: true,
        itemStyle: { color: '#2563EB' },
        lineStyle: { width: 2, color: '#2563EB' },
        data: voucherStats?.charts?.claims || [],
      },
      {
        name: 'Lượt Sử Dụng',
        type: 'line',
        smooth: true,
        itemStyle: { color: '#05251C' },
        lineStyle: { width: 2, color: '#05251C' },
        data: voucherStats?.charts?.usages || [],
      },
    ],
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <AdminPageHeader
        title="Tổng quan hoạt động"
        description="Theo dõi doanh số, đơn hàng và các chỉ số kinh doanh then chốt của 404Studio"
        actions={
          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveView('sales')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeView === 'sales'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Bán hàng
              </button>
              <button
                onClick={() => setActiveView('vouchers')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeView === 'vouchers'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Khuyến mãi
              </button>
              <button
                onClick={() => setActiveView('behavior')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeView === 'behavior'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Hành vi & Phễu
              </button>
            </div>

            {/* Refresh button */}
            <button
              onClick={
                activeView === 'sales'
                  ? fetchSalesData
                  : activeView === 'vouchers'
                  ? undefined
                  : fetchTrackingData
              }
              aria-label="Làm mới dữ liệu"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {/* Main Content Area */}
      {activeView === 'sales' ? (
        loadingSales ? (
          <div className="space-y-6">
            <KPISkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
              <div className="h-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
            </div>
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : salesError ? (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-8 text-center max-w-md mx-auto my-12 space-y-4">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-red-800 dark:text-red-400">
              Lỗi nạp dữ liệu thống kê
            </h3>
            <p className="text-red-600 dark:text-red-300 text-xs">{salesError}</p>
            <button
              onClick={fetchSalesData}
              className="bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
            >
              Thử tải lại
            </button>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Revenue */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-all hover:border-[#05251C]/40">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Tổng doanh thu
                  </span>
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(kpis.totalRevenue)}
                  </div>
                  <span className="inline-flex text-[11px] text-slate-400">
                    Từ các đơn hoàn tất
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl bg-[#05251C] text-[#F5DD20] flex items-center justify-center shrink-0 shadow-xs">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>

              {/* Card 2: Orders */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Đơn hàng hoàn tất
                  </span>
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {kpis.totalOrders}
                  </div>
                  <span className="inline-flex text-[11px] text-slate-400">
                    Giao dịch thành công
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200/80 dark:border-sky-800/60">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>

              {/* Card 3: Products */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Sản phẩm đang bán
                  </span>
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {totalProducts}
                  </div>
                  <span className="inline-flex text-[11px] text-slate-400">
                    Trong toàn danh mục
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/80 dark:border-amber-800/60">
                  <Package className="h-5 w-5" />
                </div>
              </div>

              {/* Card 4: Customers */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Khách hàng mua sắm
                  </span>
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {kpis.totalCustomers}
                  </div>
                  <span className="inline-flex text-[11px] text-slate-400">
                    Đã phát sinh đơn
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-800/60">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Graphs & Quick Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales Chart */}
              <AdminCard
                className="lg:col-span-2"
                title="Biểu đồ doanh thu"
                subtitle="Số liệu doanh số tích lũy theo chu kỳ thời gian thực"
                extra={
                  <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="h-8 px-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 cursor-pointer"
                  >
                    <option value="last7days">7 ngày qua</option>
                    <option value="last30days">30 ngày qua</option>
                    <option value="last1year">1 năm qua</option>
                  </select>
                }
              >
                {revenueOverview.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-xs text-slate-400">
                    Chưa có phát sinh doanh thu trong khoảng thời gian này.
                  </div>
                ) : (
                  <ReactECharts
                    option={salesChartOptions}
                    style={{ height: '280px', width: '100%' }}
                  />
                )}
              </AdminCard>

              {/* Quick Summary Panel */}
              <AdminCard
                title="Chỉ số hiệu suất"
                subtitle="Đo lường trung bình hoạt động bán lẻ"
              >
                <div className="space-y-5">
                  {/* AOV */}
                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Giá trị đơn hàng trung bình (AOV)
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                      {formatCurrency(kpis.avgOrderValue)}
                    </div>
                  </div>

                  {/* Sold Products */}
                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Tổng sản phẩm đã tiêu thụ
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                      {kpis.totalSoldProducts}{' '}
                      <span className="text-xs font-normal text-slate-500">sản phẩm</span>
                    </div>
                  </div>

                  {/* Customer Base */}
                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Khách hàng hoạt động
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                      {kpis.totalCustomers}{' '}
                      <span className="text-xs font-normal text-slate-500">tài khoản</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-1.5 text-xs text-[#05251C] dark:text-[#F5DD20] font-semibold">
                    <TrendingUp className="h-4 w-4" />
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
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#05251C] dark:text-[#F5DD20] hover:text-[#073D2A] transition"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
              noPadding
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Mã đơn hàng</th>
                      <th className="px-6 py-3.5">Khách hàng</th>
                      <th className="px-6 py-3.5">Tổng tiền</th>
                      <th className="px-6 py-3.5">Trạng thái</th>
                      <th className="px-6 py-3.5">Ngày đặt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {recentOrdersList.length > 0 ? (
                      recentOrdersList.map((order) => (
                        <tr
                          key={order._id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-3.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                            <Link
                              to="/admin/orders"
                              className="hover:text-[#05251C] dark:hover:text-[#F5DD20] transition"
                            >
                              #{order._id.slice(-6).toUpperCase()}
                            </Link>
                          </td>
                          <td className="px-6 py-3.5 text-slate-800 dark:text-slate-200 font-semibold">
                            {order.shipping_address?.full_name || 'Khách vãng lai'}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(order.total_price || 0)}
                          </td>
                          <td className="px-6 py-3.5">{getStatusBadge(order.status)}</td>
                          <td className="px-6 py-3.5 text-slate-400 dark:text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-8 text-center text-slate-400"
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
      ) : activeView === 'vouchers' ? (
        /* Voucher View */
        voucherLoading ? (
          <div className="space-y-6">
            <KPISkeleton />
            <div className="h-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
          </div>
        ) : !voucherStats ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <AlertCircle className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Chưa có dữ liệu thống kê Voucher
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Voucher KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Tổng mã giảm giá
                  </span>
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {voucherStats.stats.totalVouchers}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Ticket className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Đang kích hoạt
                  </span>
                  <div className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {voucherStats.stats.activeVouchers}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Percent className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Voucher hết hạn
                  </span>
                  <div className="text-2xl font-extrabold tracking-tight text-red-600 dark:text-red-400 tabular-nums">
                    {voucherStats.stats.expiredVouchers}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Đã dùng hết quota
                  </span>
                  <div className="text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                    {voucherStats.stats.soldOutVouchers}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Voucher Charts & Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AdminCard
                className="lg:col-span-2"
                title="Tương tác Voucher"
                subtitle="Lượt nhận (Claim) và lượt áp dụng thực tế (Usage)"
              >
                <ReactECharts
                  option={voucherChartOptions}
                  style={{ height: '280px', width: '100%' }}
                />
              </AdminCard>

              <AdminCard
                title="Top Voucher hiệu quả"
                subtitle="Theo tỷ lệ sử dụng cao nhất"
              >
                {voucherStats.topVouchers?.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Chưa có lượt sử dụng nào
                  </div>
                ) : (
                  <div className="space-y-4">
                    {voucherStats.topVouchers.map((v, idx) => {
                      const usageRatio = Math.min(
                        100,
                        Math.round((v.usedQuantity / (v.totalQuantity || 1)) * 100)
                      );
                      return (
                        <div key={v.code} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                              {idx + 1}. {v.code}
                            </span>
                            <span className="text-slate-500 tabular-nums">
                              {v.usedQuantity}/{v.totalQuantity} ({usageRatio}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#05251C] dark:bg-[#F5DD20] rounded-full transition-all"
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
      ) : (
        /* Behavior & Funnel Analytics View */
        loadingTracking ? (
          <div className="space-y-6">
            <KPISkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
              <div className="h-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
            </div>
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : trackingError ? (
          <AdminCard>
            <div className="p-8 text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {trackingError}
              </h3>
              <button
                onClick={fetchTrackingData}
                className="px-4 py-2 bg-[#05251C] text-white text-xs font-bold rounded-xl hover:bg-[#073D2A] transition cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          </AdminCard>
        ) : (
          <div className="space-y-6">
            {/* Behavioral KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AdminCard className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Tổng sự kiện ghi nhận
                  </span>
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {(trackingOverview?.totalEvents || 0).toLocaleString()}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <span>
                      {trackingOverview?.activeUsersCount || 0} user · {trackingOverview?.activeSessionsCount || 0} phiên
                    </span>
                  </div>
                </div>
              </AdminCard>

              <AdminCard className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Gợi ý sản phẩm (CTR)
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                    <Eye className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {trackingOverview?.recommendationMetrics?.ctrPercentage || 0}%
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <span>
                      {trackingOverview?.recommendationMetrics?.clicks || 0} click / {trackingOverview?.recommendationMetrics?.impressions || 0} hiển thị
                    </span>
                  </div>
                </div>
              </AdminCard>

              <AdminCard className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Tương tác AI Chat
                  </span>
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                    <Bot className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {trackingOverview?.aiMetrics?.ctrPercentage || 0}% CTR
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <span>
                      {trackingOverview?.aiMetrics?.cartActionConfirmedCount || 0} xác nhận giỏ qua AI
                    </span>
                  </div>
                </div>
              </AdminCard>

              <AdminCard className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Chuyển đổi mua hàng (Funnel)
                  </span>
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
                    <Filter className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {funnelData?.funnel?.[funnelData?.funnel?.length - 1]?.overallConversionRate || 0}%
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <span>
                      {funnelData?.funnel?.[funnelData?.funnel?.length - 1]?.uniqueUsers || 0} khách hoàn tất mua
                    </span>
                  </div>
                </div>
              </AdminCard>
            </div>

            {/* Conversion Funnel Visualization & Stage Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AdminCard
                className="lg:col-span-2"
                title="Phễu chuyển đổi hành vi (Conversion Funnel)"
                subtitle="Tỷ lệ giữ chân người dùng qua từng giai đoạn mua sắm"
              >
                <ReactECharts
                  option={funnelChartOptions}
                  style={{ height: '320px', width: '100%' }}
                />

                {/* Funnel Stage Breakdown Table */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100 dark:border-slate-800 pb-2">
                        <th className="py-2">Giai đoạn</th>
                        <th className="py-2 text-right">Số phiên</th>
                        <th className="py-2 text-right">Khách duy nhất</th>
                        <th className="py-2 text-right">Chuyển tiếp bước</th>
                        <th className="py-2 text-right">Tỷ lệ rớt (Drop)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(funnelData?.funnel || []).map((stg) => (
                        <tr key={stg.stage} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 font-semibold text-slate-900 dark:text-white">
                            {stg.label}
                          </td>
                          <td className="py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-300">
                            {(stg.uniqueSessions || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-300">
                            {(stg.uniqueUsers || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            {stg.stepConversionRate || 0}%
                          </td>
                          <td className="py-2.5 text-right tabular-nums font-semibold text-rose-500">
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
                  {(!trackingOverview?.topViewedProducts || trackingOverview.topViewedProducts.length === 0) ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Chưa có lượt xem nào
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {trackingOverview.topViewedProducts.slice(0, 5).map((p, idx) => (
                        <div
                          key={p._id}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                        >
                          <span className="w-5 text-xs font-bold text-slate-400 text-center">
                            #{idx + 1}
                          </span>
                          {p.image && (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {p.name}
                            </h4>
                            <span className="text-[11px] text-emerald-600 font-bold">
                              {formatCurrency(p.price)}
                            </span>
                          </div>
                          <span className="text-xs font-black text-slate-700 dark:text-slate-200 tabular-nums bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
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
                  {(!trackingOverview?.topSearches || trackingOverview.topSearches.length === 0) ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Chưa có dữ liệu tìm kiếm
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {trackingOverview.topSearches.slice(0, 8).map((s) => (
                        <span
                          key={s.query}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                        >
                          <span>{s.query}</span>
                          <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.2 rounded-full">
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
        )
      )}
    </div>
  );
};

export default Dashboard;
