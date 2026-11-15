import React from "react";
import { FaCreditCard, FaShoppingBag, FaShoppingCart, FaUsers } from "react-icons/fa";
import { AiFillProduct } from "react-icons/ai";

// 🔥 icon map theo key
const iconMap = {
  revenue: <FaCreditCard />,
  orders: <FaShoppingCart />,
  total: <FaShoppingBag />,
  customers: <FaUsers />,
  avgOrder: <FaCreditCard />,
  soldProducts: <AiFillProduct />,
};
// Tổng quan kinh doanh
// Đơn hàng của tôi
const KPIChart = ({ title, data }) => {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{title || "Chỉ số KPI"}</h2>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {safeData.length > 0 ? (
          safeData.map((item) => (
            <div key={item.key} className="bg-white p-4 rounded-xl shadow-md">
              
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">{item.label}</h3>
                <span>{iconMap[item.key]}</span>
              </div>

              <p className="text-2xl font-bold">
                {item.value?.toLocaleString()}
              </p>

              <p className="text-sm text-green-500">
                {item.description}
              </p>

            </div>
          ))
        ) : (
          <p>Chưa có dữ liệu thống kê</p>
        )}
      </div>
    </div>
  );
};

export default KPIChart;
