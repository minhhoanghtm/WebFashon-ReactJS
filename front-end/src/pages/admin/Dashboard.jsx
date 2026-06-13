import React, { useState, useEffect } from "react";
import {
  CreditCard,
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Ticket,
  Percent,
  Sparkles,
  Loader2,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import { toast } from "react-toastify";
import voucherApi from "../../api/voucher.api";

// Mock data for recent orders
const recentOrders = [
  {
    id: "ORD-001",
    customer: "Sarah Johnson",
    amount: 249.99,
    status: "Shipped",
    date: "2024-06-08",
  },
  {
    id: "ORD-002",
    customer: "Michael Chen",
    amount: 189.50,
    status: "Delivered",
    date: "2024-06-07",
  },
];

// Helper to format currency
const formatCurrency = (val) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(val);
};

// Translate status to Vietnamese & styling
const getStatusBadge = (status) => {
  const styles = {
    Shipped: "bg-purple-600 text-white dark:bg-purple-600/90",
    Delivered: "bg-green-600 text-white dark:bg-green-600/90",
    Pending: "bg-amber-500 text-white dark:bg-amber-500/90",
    Processing: "bg-blue-600 text-white dark:bg-blue-600/90",
  };

  const labels = {
    Shipped: "Đang giao hàng",
    Delivered: "Đã giao hàng",
    Pending: "Chờ xử lý",
    Processing: "Đang xử lý",
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm ${
        styles[status] || "bg-slate-500 text-white"
      }`}
    >
      {labels[status] || status}
    </span>
  );
};

const Dashboard = () => {
  const [activeView, setActiveView] = useState("sales"); // "sales" | "vouchers"
  const [range, setRange] = useState("last7days");
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Voucher states
  const [voucherStats, setVoucherStats] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  useEffect(() => {
    if (activeView === "vouchers") {
      const fetchVoucherStats = async () => {
        try {
          setVoucherLoading(true);
          const res = await voucherApi.getAdminVouchersStats();
          if (res.success) {
            setVoucherStats(res.data);
          }
        } catch (err) {
          toast.error("Không thể tải thống kê voucher");
        } finally {
          setVoucherLoading(false);
        }
      };
      fetchVoucherStats();
    }
  }, [activeView]);

  // Width: 600, Height: 200 (within a 600x250 viewBox)
  // X values: 50, 150, 250, 350, 450, 550
  // Y range: 200 (bottom) to 20 (top)
  const chartData = [
    { label: "0", revenue: 24000, sales: 4000 },
    { label: "1", revenue: 14000, sales: 3000 },
    { label: "2", revenue: 10000, sales: 2500 },
    { label: "3", revenue: 36000, sales: 3500 },
    { label: "4", revenue: 23000, sales: 3000 },
    { label: "5", revenue: 23000, sales: 2800 },
  ];

  const getCoordinates = (index, key) => {
    const x = 50 + index * 100;
    const maxVal = 40000;
    const val = chartData[index][key];
    const y = 220 - (val / maxVal) * 180;
    return { x, y };
  };

  const revenuePoints = chartData.map((_, i) => getCoordinates(i, "revenue"));
  const salesPoints = chartData.map((_, i) => getCoordinates(i, "sales"));

  const getPathD = (points) => {
    return points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");
  };

  const getAreaD = (points) => {
    const pathD = getPathD(points);
    if (!points.length) return "";
    return `${pathD} L ${points[points.length - 1].x} 220 L ${points[0].x} 220 Z`;
  };

  // ECharts Option for Voucher Analytics
  const voucherChartOptions = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985",
        },
      },
    },
    legend: {
      data: ["Lượt Nhận (Claim)", "Lượt Sử Dụng (Usage)"],
      bottom: 0,
      textStyle: {
        color: "#64748b",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        boundaryGap: true,
        data: voucherStats?.charts?.labels || [],
        axisLine: {
          lineStyle: {
            color: "#e2e8f0",
          },
        },
        axisLabel: {
          color: "#94a3b8",
        },
      },
    ],
    yAxis: [
      {
        type: "value",
        axisLine: {
          lineStyle: {
            color: "#e2e8f0",
          },
        },
        axisLabel: {
          color: "#94a3b8",
        },
        splitLine: {
          lineStyle: {
            color: "#f1f5f9",
          },
        },
      },
    ],
    series: [
      {
        name: "Lượt Nhận (Claim)",
        type: "line",
        smooth: true,
        areaStyle: {
          opacity: 0.1,
        },
        emphasis: {
          focus: "series",
        },
        data: voucherStats?.charts?.claims || [],
        itemStyle: {
          color: "#6366f1",
        },
      },
      {
        name: "Lượt Sử Dụng (Usage)",
        type: "bar",
        emphasis: {
          focus: "series",
        },
        data: voucherStats?.charts?.usages || [],
        itemStyle: {
          color: "#10b981",
        },
        barWidth: "40%",
      },
    ],
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Bảng điều khiển</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Quản lý hoạt động kinh doanh thương mại điện tử thời trang của bạn
          </p>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveView("sales")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer relative ${
            activeView === "sales"
              ? "border-blue-600 text-blue-600 font-black"
              : "border-transparent text-slate-400 hover:text-slate-650"
          }`}
        >
          Doanh số & Đơn hàng
          {activeView === "sales" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveView("vouchers")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer relative ${
            activeView === "vouchers"
              ? "border-indigo-600 text-indigo-600 font-black"
              : "border-transparent text-slate-400 hover:text-slate-650"
          }`}
        >
          Khuyến mãi & Voucher
          {activeView === "vouchers" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></span>
          )}
        </button>
      </div>

      {activeView === "sales" ? (
        <>
          {/* Sales View - Original UI */}
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Total Revenue */}
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center justify-between transition hover:shadow-md">
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Tổng doanh thu
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight">$142,430</span>
                  <span className="text-xs font-semibold text-green-500 flex items-center">
                    <ArrowUpRight className="h-3.5 w-3.5" /> 12%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>

            {/* Card 2: New Orders */}
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center justify-between transition hover:shadow-md">
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Đơn hàng mới
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight">324</span>
                  <span className="text-xs font-semibold text-green-500 flex items-center">
                    <ArrowUpRight className="h-3.5 w-3.5" /> 8%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>

            {/* Card 3: Total Products */}
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center justify-between transition hover:shadow-md">
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Tổng sản phẩm
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight">1,247</span>
                  <span className="text-xs font-semibold text-red-500 flex items-center">
                    <ArrowDownRight className="h-3.5 w-3.5" /> 2%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Package className="h-6 w-6" />
              </div>
            </div>

            {/* Card 4: Active Customers */}
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center justify-between transition hover:shadow-md">
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Khách hàng hoạt động
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight">2,891</span>
                  <span className="text-xs font-semibold text-green-500 flex items-center">
                    <ArrowUpRight className="h-3.5 w-3.5" /> 15%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-500/20">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Graphs & Quick Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Overview (Line chart) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Tổng quan doanh số</h3>
                  {/* Legend */}
                  <div className="flex items-center gap-4 text-xs font-medium mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block"></span>
                      <span className="text-slate-500 dark:text-slate-400">Doanh thu (revenue)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-purple-500 inline-block"></span>
                      <span className="text-slate-500 dark:text-slate-400">Số lượng bán (sales)</span>
                    </div>
                  </div>
                </div>
                
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
                >
                  <option value="last7days">7 ngày qua</option>
                  <option value="last30days">30 ngày qua</option>
                  <option value="last1year">1 năm qua</option>
                </select>
              </div>

              {/* SVG Line Chart */}
              <div className="relative pt-2">
                <svg
                  viewBox="0 0 600 250"
                  className="w-full h-auto overflow-visible"
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[40, 85, 130, 175, 220].map((yVal, idx) => (
                    <line
                      key={idx}
                      x1="40"
                      y1={yVal}
                      x2="560"
                      y2={yVal}
                      className="stroke-slate-200 dark:stroke-slate-800/80"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Y Axis Labels */}
                  <text x="30" y="44" textAnchor="end" className="fill-slate-400 text-[9px] font-medium">40000</text>
                  <text x="30" y="89" textAnchor="end" className="fill-slate-400 text-[9px] font-medium">30000</text>
                  <text x="30" y="134" textAnchor="end" className="fill-slate-400 text-[9px] font-medium">20000</text>
                  <text x="30" y="179" textAnchor="end" className="fill-slate-400 text-[9px] font-medium">10000</text>
                  <text x="30" y="224" textAnchor="end" className="fill-slate-400 text-[9px] font-medium">0</text>

                  {/* Area under paths */}
                  <path d={getAreaD(revenuePoints)} fill="url(#revenueGrad)" />
                  <path d={getAreaD(salesPoints)} fill="url(#salesGrad)" />

                  {/* Line paths */}
                  <path
                    d={getPathD(revenuePoints)}
                    className="stroke-blue-500"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d={getPathD(salesPoints)}
                    className="stroke-purple-500"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />

                  {/* Chart Interaction / Vertical Hover Bar */}
                  {hoveredPoint !== null && (
                    <line
                      x1={50 + hoveredPoint * 100}
                      y1="30"
                      x2={50 + hoveredPoint * 100}
                      y2="220"
                      className="stroke-slate-300 dark:stroke-slate-700"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Interactive Circles / Hover Zones */}
                  {chartData.map((d, i) => {
                    const rp = revenuePoints[i];
                    const sp = salesPoints[i];
                    return (
                      <g key={i}>
                        {/* Points on Line */}
                        <circle
                          cx={rp.x}
                          cy={rp.y}
                          r={hoveredPoint === i ? "6" : "4.5"}
                          className="fill-blue-500 stroke-white dark:stroke-slate-900 transition-all"
                          strokeWidth="2"
                        />
                        <circle
                          cx={sp.x}
                          cy={sp.y}
                          r={hoveredPoint === i ? "5" : "3.5"}
                          className="fill-purple-500 stroke-white dark:stroke-slate-900 transition-all"
                          strokeWidth="2"
                        />

                        {/* Invisible Hitbox Rect for Mouse Hover */}
                        <rect
                          x={20 + i * 100}
                          y="20"
                          width="60"
                          height="210"
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredPoint(i)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />

                        {/* X Axis Labels */}
                        <text
                          x={rp.x}
                          y="240"
                          textAnchor="middle"
                          className="fill-slate-400 text-[10px] font-semibold"
                        >
                          {d.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Custom React Tooltip overlay */}
                {hoveredPoint !== null && (
                  <div
                    className="absolute bg-slate-900/95 dark:bg-slate-800/95 text-white border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs space-y-1 z-30 pointer-events-none transition-all duration-150"
                    style={{
                      left: `${(50 + hoveredPoint * 100) / 6}%`,
                      transform: "translateX(-50%)",
                      top: "20px",
                    }}
                  >
                    <div className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-300 text-center">
                      Mốc {hoveredPoint}
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Doanh thu:</span>
                      <span className="font-semibold text-blue-400">
                        {formatCurrency(chartData[hoveredPoint].revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Sản phẩm:</span>
                      <span className="font-semibold text-purple-400">
                        {chartData[hoveredPoint].sales}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Panel */}
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Thống kê nhanh</h3>
                <p className="text-xs text-slate-400">Đo lường các chỉ số chính yếu</p>
              </div>

              <div className="space-y-5 flex-1 flex flex-col justify-center font-sans">
                {/* Conversion Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Tỷ lệ chuyển đổi</span>
                    <span>3.2%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full w-[32%]"></div>
                  </div>
                </div>

                {/* Average Order Value */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Giá trị đơn hàng TB</span>
                    <span>$87.50</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full w-[58%]"></div>
                  </div>
                </div>

                {/* Customer Retention */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Giữ chân khách hàng</span>
                    <span>72%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full w-[72%]"></div>
                  </div>
                </div>
              </div>

              {/* Little footer graphic or details */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center gap-2 text-xs text-blue-500 font-semibold cursor-pointer hover:underline">
                <TrendingUp className="h-4 w-4" />
                <span>Xem báo cáo chi tiết chỉ số</span>
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Đơn hàng gần đây</h3>
              <span className="text-xs text-slate-400">Hiển thị 2 đơn hàng mới nhất</span>
            </div>

            {/* Table wrapper */}
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80 text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Mã đơn hàng</th>
                    <th className="px-6 py-4">Khách hàng</th>
                    <th className="px-6 py-4">Tổng tiền</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Ngày đặt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-200">
                        {order.customer}
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {order.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Voucher View - New implementation */}
          {voucherLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-650 mb-2" />
              <p className="text-sm text-slate-450">Đang phân tích số liệu khuyến mãi...</p>
            </div>
          ) : !voucherStats ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-850 rounded-2xl border">
              <AlertCircle className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500">Chưa có dữ liệu thống kê Voucher</p>
            </div>
          ) : (
            <>
              {/* Voucher KPI grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
                {/* Total Vouchers */}
                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center justify-between transition hover:shadow-md">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Tổng mã giảm giá
                    </span>
                    <div className="text-2xl font-bold tracking-tight text-slate-850 dark:text-slate-100">
                      {voucherStats.stats.totalVouchers}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <Ticket className="h-6 w-6" />
                  </div>
                </div>

                {/* Active Vouchers */}
                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center justify-between transition hover:shadow-md">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Đang chạy (Active)
                    </span>
                    <div className="text-2xl font-bold tracking-tight text-emerald-600">
                      {voucherStats.stats.activeVouchers}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <Percent className="h-6 w-6" />
                  </div>
                </div>

                {/* Expired Vouchers */}
                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center justify-between transition hover:shadow-md">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Voucher hết hạn
                    </span>
                    <div className="text-2xl font-bold tracking-tight text-red-500">
                      {voucherStats.stats.expiredVouchers}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/25">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                </div>

                {/* Out of Stock Vouchers */}
                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center justify-between transition hover:shadow-md">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Đã sử dụng hết
                    </span>
                    <div className="text-2xl font-bold tracking-tight text-amber-500">
                      {voucherStats.stats.soldOutVouchers}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Voucher Charts & Top Vouchers */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                {/* Claims and Usages Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold">Tổng quan chiến dịch khuyến mãi</h3>
                    <p className="text-xs text-slate-400">Lượt săn (claim) và lượt dùng (usage) trong 7 ngày qua</p>
                  </div>
                  <div className="pt-4">
                    <ReactECharts option={voucherChartOptions} style={{ height: "300px" }} />
                  </div>
                </div>

                {/* Top Vouchers */}
                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold">Top Voucher được dùng</h3>
                    <p className="text-xs text-slate-400">Top 5 voucher có lượt sử dụng cao nhất</p>
                  </div>

                  {voucherStats.topVouchers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <Ticket className="h-8 w-8 text-slate-300 mb-1" />
                      <p className="text-xs text-slate-400">Chưa ghi nhận lượt dùng nào</p>
                    </div>
                  ) : (
                    <div className="flex-1 space-y-4">
                      {voucherStats.topVouchers.map((v, idx) => {
                        const usageRatio = Math.round((v.usedQuantity / v.totalQuantity) * 100);
                        return (
                          <div key={v.code} className="space-y-1">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <div className="flex items-center gap-2">
                                <span className="h-5 w-5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center text-[10px] font-mono font-bold">
                                  {idx + 1}
                                </span>
                                <span className="font-mono text-slate-800 dark:text-slate-100">{v.code}</span>
                              </div>
                              <span className="text-slate-500">
                                {v.usedQuantity} / {v.totalQuantity} ({usageRatio}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${usageRatio}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center gap-2 text-xs text-indigo-500 font-semibold cursor-pointer hover:underline">
                    <TrendingUp className="h-4 w-4" />
                    <span>Chiến dịch hiệu quả nhất</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard
