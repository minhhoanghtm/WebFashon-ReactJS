import React, { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";

const RevenueChart = ({ data, type, setType }) => {
  const [range, setRange] = useState("last7days");

  const rangeLabel = {
    last7days: "7 ngày qua",
    last30days: "30 ngày qua",
    last1year: "1 năm qua",
  };

  // 🔥 map range → type
  const handleRangeChange = (e) => {
    const value = e.target.value;
    setRange(value);

    if (value === "last7days") setType("week");
    if (value === "last30days") setType("month");
    if (value === "last1year") setType("year");
  };

  // 🔥 tách labels + data
  const { labels, values } = useMemo(() => {
    return {
      labels: data.map((item) => item.date),
      values: data.map((item) => item.revenue),
    };
  }, [data]);

  const chartOptions = {
    title: {
      text: `Doanh thu ${rangeLabel[range]}`,
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      formatter: (params) =>
        `${params[0].name}: ${params[0].value.toLocaleString()} VND`,
    },
    xAxis: {
      type: "category",
      data: labels,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: values,
        type: type === "year" ? "line" : "bar",
        smooth: type === "year",
      },
    ],
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Thống kê doanh thu</h2>

        <select
          className="border border-gray-300 rounded-md p-2"
          value={range}
          onChange={handleRangeChange}
        >
          <option value="last7days">7 ngày qua</option>
          <option value="last30days">30 ngày qua</option>
          <option value="last1year">1 năm qua</option>
        </select>
      </div>

      <ReactECharts option={chartOptions} style={{ height: "400px" }} />
    </div>
  );
};

export default RevenueChart;