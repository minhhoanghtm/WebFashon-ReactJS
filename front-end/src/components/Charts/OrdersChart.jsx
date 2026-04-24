import React, { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react';

const OrdersChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Giả sử gọi API và nhận được dữ liệu
    setData([
      { status: 'Đang xử lý', value: 120 },
      { status: 'Đang giao hàng', value: 80 },
      { status: 'Đã giao hàng', value: 150 },
      { status: 'Đã hủy', value: 30 },
    ]);
  }, []);

  const chartOptions = {
    title: {
      text: 'Tỷ lệ trạng thái đơn hàng',
      left: 'center',
      top: 20,
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertival',
      left: 'left',
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: data.map(item => ({ name: item.status, value: item.value })),
      }
    ]
  };
  return (
    <div>
        {/* Hiển thị biểu đồ */}
        <div>
          <ReactECharts option={chartOptions} />
        </div>
    </div>
  )
}

export default OrdersChart
