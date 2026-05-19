import { Card } from "antd";
import { useEffect, useState } from "react";
import KPIChart from "../../components/Charts/KPIChart";
import OrdersChart from "../../components/Charts/OrdersChart";
import TopProductsChart from "../../components/Charts/TopProductsChart";
import CategoryChart from "../../components/Charts/CategoryChart";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getPurchasePerformanceService } from "@/services/order.service";

  const option = [
    {
      key: "kpi",
      title: "Chỉ số KPI",
      description: "Hiệu suất mua hàng.",
    },
    // {
    //   key: "orders",
    //   title: "Đơn hàng",
    //   description: "Biểu đồ số lượng đơn hàng theo thời gian.",
    // },
    // {
    //   key: "top-products",
    //   title: "Sản phẩm bán chạy",
    //   description: "Top 10 sản phẩm đã mua.",
    // },
    // {
    //   key: "category-performance",
    //   title: "Hiệu suất danh mục",
    //   description: "Phân bố theo doanh mục sản phẩm.",
    // }
  ];

const DashboardUser = () => {
  useDocumentTitle("Dashboard Thống Kê");
  const [performanceData, setPerformanceData] = useState([]);
  const [selectedOption, setSelectedOption] = useState("kpi");

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const response = await getPurchasePerformanceService();
        const stats = response?.data || {};

        const nextPerformanceData = [
          {
            key: "orders",
            label: "Đơn hàng của tôi",
            value: stats.totalOrders || 0,
            description: "Tổng số đơn hàng đã đặt",
          },
          {
            key: "total",
            label: "Sản phẩm đã mua",
            value: stats.totalProductsPurchased || 0,
            description: "Tổng số sản phẩm đã được giao thành công",
          },
          {
            key: "revenue",
            label: "Tổng chi tiêu",
            value: stats.totalPaid || 0,
            description: `Tỉ lệ hủy đơn: ${stats.cancelRate || "0%"}`,
          },
        ];

        setPerformanceData(nextPerformanceData);
      }
      catch (error) {
        console.error("Lỗi khi lấy dữ liệu hiệu suất mua hàng:", error);
        setPerformanceData([]);
      }
    };

    fetchPerformanceData();
  }, []);

  //Map chart
  const chartMap = {
    kpi: <KPIChart title="Tổng quan kinh doanh" data={performanceData} />,
    orders: <OrdersChart />,
    "top-products": <TopProductsChart />,
    "category-performance": <CategoryChart />,
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
                      ? "bg-blue-500! border-blue-500! text-white! shadow-lg!"
                      : "bg-white border-gray-200 hover:border-blue-400 hover:shadow-md"
                  }
                `}
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
      <div className="mt-4">
        {chartMap[selectedOption]}
      </div>
    </div>
  );
};

export default DashboardUser;
