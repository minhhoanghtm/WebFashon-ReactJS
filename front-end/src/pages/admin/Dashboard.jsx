import React, { useState, useEffect } from "react";
import {
  CreditCard,
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  Ticket,
  Percent,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import { toast } from "react-toastify";
import voucherApi from "../../api/voucher.api";
import {
  DashboardService,
  getRevenueOverviewService,
  getAdminOrdersService,
} from "@/services/order.service";
import { getAllProductService } from "@/services/product.service";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import useWebsiteSettings from "@/hooks/useWebsiteSettings";

const formatCurrency = (val) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(val);
};

const getStatusBadge = (status) => {
  const styles = {
    shipping: "bg-purple-600 text-white dark:bg-purple-600/90",
    shipped: "bg-purple-600 text-white dark:bg-purple-600/90",
    delivered: "bg-green-600 text-white dark:bg-green-600/90",
    pending: "bg-amber-500 text-white dark:bg-amber-500/90",
    confirmed: "bg-blue-600 text-white dark:bg-blue-600/90",
    cancelled: "bg-red-500 text-white dark:bg-red-500/90",
  };

  const labels = {
    shipping: "Đang giao",
    shipped: "Đang giao",
    delivered: "Đã giao",
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    cancelled: "Đã hủy",
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
  const { settings } = useWebsiteSettings();
  const general = settings?.general || {};
  const siteName = general.siteName || "";
  useDocumentTitle("Bảng điều khiển");
  const [activeView, setActiveView] = useState("sales"); // "sales" | "vouchers"
  const [range, setRange] = useState("last7days");

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

  const fetchSalesData = async () => {
    try {
      setLoadingSales(true);
      setSalesError(null);

      const typeMap = {
        last7days: "week",
        last30days: "month",
        last1year: "year",
      };
      const type = typeMap[range] || "week";

      const [kpiData, revenueData, ordersData, productsList] =
        await Promise.all([
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
        },
      );
      setRevenueOverview(revenueData || []);
      setRecentOrdersList(ordersData?.items || []);
      setTotalProducts(productsList?.length || 0);
    } catch (err) {
      console.error("Fetch sales dashboard error:", err);
      setSalesError("Không thể tải báo cáo số liệu bán hàng.");
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    if (activeView === "sales") {
      fetchSalesData();
    }
  }, [activeView, range]);

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

  // ECharts Option for Sales Analytics
  const salesChartOptions = {
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => formatCurrency(value || 0),
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#3b82f6",
        },
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        boundaryGap: false,
        data: revenueOverview.map((item) => item.date),
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
          formatter: (value) => formatCurrency(value),
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
        name: "Doanh thu (VNĐ)",
        type: "line",
        smooth: true,
        data: revenueOverview.map((item) => item.revenue),
        itemStyle: {
          color: "#3b82f6",
        },
        areaStyle: {
          opacity: 0.15,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#3b82f6" },
              { offset: 1, color: "rgba(59, 130, 246, 0.0)" },
            ],
          },
        },
      },
    ],
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
      data: ["Lượt Nhận", "Lượt Sử Dụng"],
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
        name: "Lượt Nhận",
        type: "line",
        smooth: true,
        areaStyle: {
          opacity: 0.1,
        },
        data: voucherStats?.charts?.claims || [],
      },
      {
        name: "Lượt Sử Dụng",
        type: "line",
        smooth: true,
        areaStyle: {
          opacity: 0.1,
        },
        data: voucherStats?.charts?.usages || [],
      },
    ],
  };

  return (
    <div className="space-y-8 relative text-left">
      {/* View Toggle tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Thống kê chung
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Số liệu thống kê kinh doanh và chiến dịch Voucher
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setActiveView("sales")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeView === "sales"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
            }`}
          >
            Báo cáo bán hàng
          </button>
          <button
            onClick={() => setActiveView("vouchers")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeView === "vouchers"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
            }`}
          >
            Chiến dịch Vouchers
          </button>
        </div>
      </div>

      {activeView === "sales" ? (
        loadingSales ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-slate-500">
              Đang tổng hợp số liệu doanh thu...
            </p>
          </div>
        ) : salesError ? (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-red-800 dark:text-red-400">
              Lỗi nạp dữ liệu
            </h3>
            <p className="text-red-600 dark:text-red-300 text-sm">
              {salesError}
            </p>
            <button
              onClick={fetchSalesData}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-6 py-2 rounded-xl transition cursor-pointer"
            >
              Tải lại
            </button>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
              {/* Card 1: Revenue */}
              <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center justify-between transition hover:shadow-md">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Tổng doanh thu
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight">
                      {formatCurrency(kpis.totalRevenue)}
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
                    Đơn hàng hoàn tất
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight">
                      {kpis.totalOrders}
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
                    Tổng sản phẩm tồn kho
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight">
                      {totalProducts}
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
                    Khách hàng mua sắm
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight">
                      {kpis.totalCustomers}
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
                    <h3 className="text-lg font-bold">Biểu đồ doanh thu</h3>
                    <p className="text-xs text-slate-400">
                      Doanh thu bán hàng tích lũy thực tế
                    </p>
                  </div>

                  <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <option value="last7days">7 ngày qua</option>
                    <option value="last30days">30 ngày qua</option>
                    <option value="last1year">1 năm qua</option>
                  </select>
                </div>

                <div className="pt-2">
                  {revenueOverview.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                      Không có dữ liệu trong khoảng thời gian này.
                    </div>
                  ) : (
                    <ReactECharts
                      option={salesChartOptions}
                      style={{ height: "300px" }}
                    />
                  )}
                </div>
              </div>

              {/* Quick Stats Panel */}
              <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Thống kê nhanh</h3>
                  <p className="text-xs text-slate-400">
                    Đo lường các chỉ số chính yếu
                  </p>
                </div>

                <div className="space-y-5 flex-1 flex flex-col justify-center font-sans">
                  {/* Average Order Value */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-slate-600 dark:text-slate-400">
                        Giá trị đơn hàng TB
                      </span>
                      <span>{formatCurrency(kpis.avgOrderValue)}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full w-[65%]"></div>
                    </div>
                  </div>

                  {/* Total Sold Products */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-slate-600 dark:text-slate-400">
                        Tổng sản phẩm đã bán
                      </span>
                      <span>{kpis.totalSoldProducts} sản phẩm</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-[50%]"></div>
                    </div>
                  </div>

                  {/* Customers Count */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-slate-600 dark:text-slate-400">
                        Tổng khách hàng
                      </span>
                      <span>{kpis.totalCustomers}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full w-[45%]"></div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center gap-2 text-xs text-blue-500 font-semibold cursor-pointer hover:underline">
                  <TrendingUp className="h-4 w-4" />
                  <span>Dữ liệu thống kê tự động cập nhật từ server</span>
                </div>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Đơn hàng gần đây</h3>
                <span className="text-xs text-slate-400">
                  Hiển thị các giao dịch mới nhất
                </span>
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
                    {recentOrdersList.length > 0 ? (
                      recentOrdersList.map((order) => (
                        <tr
                          key={order._id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400">
                            {order._id}
                          </td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-200">
                            {order.shipping_address?.full_name ||
                              "Khách vãng lai"}
                          </td>
                          <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                            {formatCurrency(order.total_price || 0)}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                            {new Date(order.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
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
            </div>
          </>
        )
      ) : (
        <>
          {/* Voucher View */}
          {voucherLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-650 mb-2" />
              <p className="text-sm text-slate-450">
                Đang phân tích số liệu khuyến mãi...
              </p>
            </div>
          ) : !voucherStats ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-850 rounded-2xl border">
              <AlertCircle className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500">
                Chưa có dữ liệu thống kê Voucher
              </p>
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
                      Còn hiệu lực
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
                    <h3 className="text-lg font-bold">
                      Tổng quan chiến dịch khuyến mãi
                    </h3>
                    <p className="text-xs text-slate-400">
                      Lượt săn (claim) và lượt dùng (usage) trong 7 ngày qua
                    </p>
                  </div>
                  <div className="pt-4">
                    <ReactECharts
                      option={voucherChartOptions}
                      style={{ height: "300px" }}
                    />
                  </div>
                </div>

                {/* Top Vouchers */}
                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold">Top Voucher được dùng</h3>
                    <p className="text-xs text-slate-400">
                      Top 5 voucher có lượt sử dụng cao nhất
                    </p>
                  </div>

                  {voucherStats.topVouchers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <Ticket className="h-8 w-8 text-slate-300 mb-1" />
                      <p className="text-xs text-slate-400">
                        Chưa ghi nhận lượt dùng nào
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 space-y-4">
                      {voucherStats.topVouchers.map((v, idx) => {
                        const usageRatio = Math.round(
                          (v.usedQuantity / v.totalQuantity) * 100,
                        );
                        return (
                          <div key={v.code} className="space-y-1">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <div className="flex items-center gap-2">
                                <span className="h-5 w-5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center text-[10px] font-mono font-bold">
                                  {idx + 1}
                                </span>
                                <span className="font-mono text-slate-800 dark:text-slate-100">
                                  {v.code}
                                </span>
                              </div>
                              <span className="text-slate-500">
                                {v.usedQuantity} / {v.totalQuantity} (
                                {usageRatio}%)
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
  );
};

export default Dashboard;
