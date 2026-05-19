import { Card, Col, Row } from "antd";
import { useEffect, useState } from "react";
import KPIChart from "../../components/Charts/KPIChart";
import RevenueChart from "../../components/Charts/RevenueChart";
import OrdersChart from "../../components/Charts/OrdersChart";
import TopProductsChart from "../../components/Charts/TopProductsChart";
import CategoryChart from "../../components/Charts/CategoryChart";
import CustomerChart from "../../components/Charts/CustomerChart";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  dashboardAdminService,
  getRevenueOverviewService,
} from "@/services/order.service";
import { getOrderStatsApi } from "@/api/orderApi";

const option = [
  {
    key: "kpi",
    title: "Chỉ số KPI",
    description: "Tổng quan về hiệu suất kinh doanh.",
  },
  {
    key: "revenue",
    title: "Doanh thu",
    description: "Biểu đồ doanh thu.",
  },
  {
    key: "orders",
    title: "Đơn hàng",
    description: "Biểu đồ số lượng đơn hàng theo thời gian.",
  },
  // {
  //   key: "top-products",
  //   title: "Sản phẩm bán chạy",
  //   description: "Top 10 sản phẩm bán chạy nhất.",
  // },
  // {
  //   key: "category-performance",
  //   title: "Hiệu suất danh mục",
  //   description: "Phân bố theo doanh mục sản phẩm.",
  // },
  // {
  //   key: "customer",
  //   title: "Khách hàng",
  //   description: "Khách hàng thân thiết và mới.",
  // },
];

const DashboardAdmin = () => {
  useDocumentTitle("Dashboard thống kê");
  const [selectedOption, setSelectedOption] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [soldProducts, setSoldProducts] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [type, setType] = useState("week");
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    confirmedOrders: 0,
    shippingOrders: 0,
  });
  //KPI Chart data
  useEffect(() => {
    // Gọi API để lấy dữ liệu thống kê khi component được mount
    const fetchData = async () => {
      const adminRes = await dashboardAdminService();
      const adminData = adminRes.data;
      console.log("Dữ liệu thống kê admin:", adminData);
      // Xử lý dữ liệu và cập nhật state nếu cần thiết
      console.log("Total Revenue:", adminData.totalRevenue);
      setTotalRevenue(adminData.totalRevenue);
      console.log("Total Orders:", adminData.totalOrders);
      setTotalOrders(adminData.totalOrders);
      console.log("Total Customers:", adminData.totalCustomers);
      setTotalCustomers(adminData.totalCustomers);
      console.log("Total Customers:", adminData.totalCustomers);
      setSoldProducts(adminData.totalSoldProducts);
      console.log("Sold Products:", adminData.totalSoldProducts);
      setAvgOrderValue(adminData.avgOrderValue);
      console.log("Average Order Value:", adminData.avgOrderValue);
    };
    fetchData();
  }, []);
  const kpiChart = [
    { key: "revenue", label: "Tổng doanh thu", value: totalRevenue },
    { key: "orders", label: "Tổng đơn hàng", value: totalOrders },
    { key: "customers", label: "Tổng khách hàng", value: totalCustomers },
    {
      key: "avgOrder",
      label: "Giá trị trung bình đơn hàng",
      value: avgOrderValue,
    },
    { key: "soldProducts", label: "Sản phẩm đã bán", value: soldProducts },
  ];

  //Biểu đồ KPI
  useEffect(() => {
    if (selectedOption === "revenue") {
      // Gọi API để lấy dữ liệu KPI khi chọn biểu đồ KPI
      const fetchRevenueChart = async () => {
        const res = await getRevenueOverviewService(type);
        const revenueData = res.data;
        console.log("Dữ liệu doanh thu:", revenueData);
        setRevenueData(revenueData);
      };
      fetchRevenueChart();
    }
  }, [type, selectedOption]);


  //Trang thai don hang
  useEffect(() => {
    if (selectedOption === "orders") {
      // Gọi API để lấy dữ liệu trạng thái đơn hàng khi chọn biểu đồ trạng thái đơn hàng
      const fetchOrderStats = async () => {
        const res = await getOrderStatsApi();
        const orderData = res?.data || {};
        console.log("Dữ liệu trạng thái đơn hàng:", orderData);
        setOrderStats(orderData);
      };
      fetchOrderStats();
    }
  }, [selectedOption]);

  //Map chart
  const chartMap = {
    kpi: <KPIChart title="Chỉ số KPI" data={kpiChart} />,
    revenue: <RevenueChart data={revenueData} type={type} setType={setType} />,
    orders: <OrdersChart chartData={orderStats} />,
    // "top-products": <TopProductsChart />,
    // "category-performance": <CategoryChart />,
    // customer: <CustomerChart />,
  };
  return (
    <div className="w-full p-6">
      <h1 className="text-2xl font-black">Dashboard Thống Kê</h1>
      <span className="text-sm text-gray-600">
        Cửa hàng thời trang 404Studio
      </span>
      {/* Chọn biểu đồ hiển thị */}
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-4">Chọn Biểu Đồ Hiển Thị</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {option.map((item) => (
            <div key={item.key}>
              <Card
                onClick={() =>
                  setSelectedOption(
                    selectedOption === item.key ? null : item.key,
                  )
                }
                className={`
                  h-full rounded-xl p-4 cursor-pointer transition-all duration-300 border
                  ${
                    selectedOption === item.key
                      ? "!bg-blue-500 !border-blue-500 !text-white !shadow-lg"
                      : "bg-white border-gray-200 hover:border-blue-400 hover:shadow-md"
                  }
                `}
                headStyle={{
                  color: selectedOption === item.key ? "#fff" : "#000",
                  fontWeight: "bold",
                }}
              >
                <p
                  className={`text-sm ${
                    selectedOption === item.key ? "text-white" : "text-gray-600"
                  }`}
                >
                  {item.description}
                </p>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Hiển thị biểu đồ đã chọn */}
      <div className="mt-4">{selectedOption && chartMap[selectedOption]}</div>
    </div>
  );
};

export default DashboardAdmin;
