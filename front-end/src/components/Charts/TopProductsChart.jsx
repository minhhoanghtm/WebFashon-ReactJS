import React, { useEffect, useState } from "react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);

const TopProductsChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Giả sử gọi API và nhận được dữ liệu
    setData([
      { name: "Sản phẩm A", value: 120, revenue: 2400000 },
      { name: "Sản phẩm B", value: 80, revenue: 1600000 },
      { name: "Sản phẩm C", value: 150, revenue: 3000000 },
      { name: "Sản phẩm D", value: 30, revenue: 600000 },
    ]);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Thống kê sản phẩm bán chạy</h2>
      <div>
        {data.length > 0 ? (
          <table className="overflow-x-auto w-full border-collapse border">
            <thead>
              <tr>
                <th className="text-center border">STT</th>
                <th className="text-center border">Sản phẩm</th>
                <th className="text-center border">Số lượng bán</th>
                <th className="text-center border">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {data.map((product, index) => (
                <tr key={index}>
                  <td className="text-center border">{index + 1}</td>
                  <td className="text-center border">{product.name}</td>
                  <td className="text-center border">{product.value}</td>
                  <td className="text-center border">{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
            </tbody>

          </table>
        ) : (
          <p>Chưa có dữ liệu thống kê</p>
        )}
      </div>
    </div>
  );
};

export default TopProductsChart;
