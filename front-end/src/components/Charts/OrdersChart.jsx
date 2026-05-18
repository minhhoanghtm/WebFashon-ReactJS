import ReactECharts from 'echarts-for-react';

const OrdersChart = ({ chartData }) => {
  if (!chartData) {
    return ;
  }
  console.log("Received order stats for chart:", chartData);
  const data = [
    { name: "Chờ xử lý", value: chartData?.data?.pendingOrders || 0 },
    { name: "Đã xác nhận", value: chartData?.data?.confirmedOrders || 0 },
    { name: "Đang giao", value: chartData?.data?.shippingOrders || 0 },
    { name: "Đã giao", value: chartData?.data?.deliveredOrders || 0 },
    { name: "Đã huỷ", value: chartData?.data?.cancelledOrders || 0 },
  ];

  const chartOptions = {
    title: {
      text: "Tỷ lệ trạng thái đơn hàng",
      left: "center",
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      left: "left",
    },
    series: [
      {
        type: "pie",
        radius: "55%",
        data,
      },
    ],
  };

  return <ReactECharts option={chartOptions} />;
};

export default OrdersChart;