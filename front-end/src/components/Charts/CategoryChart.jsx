import React, { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react';
const CategoryChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    setData([
      { name: "Ao thun", value: 120 },
      { name: "Ao khoac", value: 80 },
      { name: "Non", value: 150 },
      { name: "Phu kien", value: 30 },
    ]);
  }, []);

  //bieu do
  const renderChart = {
    title: {
      text: 'Thống kê danh mục',
      left: 'center',
      top: 20,
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: 'Danh mục',
        type: 'pie',
        radius: '50%',
        data: data.map(item => ({ name: item.name, value: item.value })),
      }
    ]
  }
  return (
    <div>
      <ReactECharts option={renderChart} style={{ height: '400px' }} />
    </div>
  )
}

export default CategoryChart
