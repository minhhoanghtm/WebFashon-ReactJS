import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
const CustomerChart = () => {
  const [selectedChart, setSelectedChart] = useState("ratio");
  const [ratioCustomers, setRatioCustomers] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);

  useEffect(() => {
    setRatioCustomers([
      { month: "Tháng 1", new: 120, returning: 80 },
      { month: "Tháng 2", new: 150, returning: 100 },
      { month: "Tháng 3", new: 180, returning: 120 },
    ]);
  }, []);

  useEffect(() => {
    setTopCustomers([
      { name: "Nguyễn Văn A", value: 500 },
      { name: "Trần Thị B", value: 300 },
      { name: "Lê Văn C", value: 200 },
    ]);
  }, []);

  const renderChart = {
    title: {
      text: "Tỉ lệ khách hàng",
      left: "center",
      top: 20,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {
      top: 50,
      data: ["Khách hàng mới", "Khách hàng quay lại"],
    },
    dataset: {
      source: ratioCustomers,
    },
    xAxis: {
      type: "category",
      data: ratioCustomers.map((item) => item.month),
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        type: "bar",
        name: "Khách hàng mới",
        encode: {
          x: "month",
          y: "new",
        },
      },
      {
        type: "bar",
        name: "Khách hàng quay lại",
        encode: {
          x: "month",
          y: "returning",
        },
      },
    ],
  };
  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-xl font-bold mb-4">Thống kê khách hàng</h2>
        <select
          name="customerType"
          id="customerType"
          className="border"
          value={selectedChart}
          onChange={(e) => setSelectedChart(e.target.value)}
        >
          <option value="ratio">Tỷ lệ khách hàng</option>
          <option value="top">Top khách hàng</option>
        </select>
      </div>
      <div>
        {selectedChart === "ratio" ? (
          <ReactECharts option={renderChart} style={{ height: "400px" }} />
        ) : (
          <>
            <h3 className="text-center text-lg font-semibold mb-2">Top khách hàng</h3>
            <div>
              {topCustomers.length > 0 ? (
                <table className="overflow-x-auto w-full border-collapse border">
                  <thead>
                    <tr>
                      <th className="text-center border">STT</th>
                      <th className="text-center border">Tên khách hàng</th>
                      <th className="text-center border">Doanh số</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((customer, index) => (
                      <tr key={index}>
                        <td className="text-center border">{index + 1}</td>
                        <td className="text-center border">{customer.name}</td>
                        <td className="text-center border">{customer.value.toLocaleString("vi-VN")}VNĐ</td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              ) : (
                <p>Chưa có dữ liệu thống kê</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerChart;
