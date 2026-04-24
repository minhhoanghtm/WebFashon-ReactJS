import { Card, Col, Row } from "antd";
import { useState } from "react";
import KPIChart from "../../components/Charts/KPIChart";
import RevenueChart from "../../components/Charts/RevenueChart";
import OrdersChart from "../../components/Charts/OrdersChart";
import TopProductsChart from "../../components/Charts/TopProductsChart";
import CategoryChart from "../../components/Charts/CategoryChart";
import CustomerChart from "../../components/Charts/CustomerChart";
const DashboardAdmin = () => {
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
    {
      key: "top-products",
      title: "Sản phẩm bán chạy",
      description: "Top 10 sản phẩm bán chạy nhất.",
    },
    {
      key: "category-performance",
      title: "Hiệu suất danh mục",
      description: "Phân bố theo doanh mục sản phẩm.",
    },
    {
      key: "customer",
      title: "Khách hàng",
      description: "Khách hàng thân thiết và mới.",
    },
  ];

  //Map chart
  const chartMap = {
    kpi: <KPIChart />,
    revenue: <RevenueChart />,
    orders: <OrdersChart />,
    "top-products": <TopProductsChart />,
    "category-performance": <CategoryChart />,
    customer: <CustomerChart />,
  };

  const [selectedOption, setSelectedOption] = useState(null);
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
      <div className="mt-4">
        {selectedOption && chartMap[selectedOption]}
      </div>
    </div>
  );
};

export default DashboardAdmin;
