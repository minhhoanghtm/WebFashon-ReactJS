import React, { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react';
const RevenueChart = () => {
  const [range, setRange] = useState('last7days');
  const [data, setData] = useState([]);
  const [labels, setLabels] = useState([]);

    // map label hiển thị
  const rangeLabel = {
    last7days: "7 ngày qua",
    last30days: "30 ngày qua",
    last1year: "1 năm qua",
  };

  //GOi API lấy dữ liệu doanh thu theo khoảng thời gian
  useEffect(() => {
    // Giả sử gọi API và nhận được dữ liệu
    if(range === "last7days") {
      setData([100, 200, 150, 300, 250, 400, 350]);
      setLabels(['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']);
    } else if(range === "last30days") {
      setData([100, 200, 150, 300, 250, 400, 350, 120, 220, 180, 320, 270, 420, 370, 130, 230, 190, 330, 280, 430, 380, 140, 240, 200, 340, 290, 440, 390]);
      setLabels(['Ngày 1', 'Ngày 2', 'Ngày 3', 'Ngày 4', 'Ngày 5', 'Ngày 6', 'Ngày 7', 'Ngày 8', 'Ngày 9', 'Ngày 10', 'Ngày 11', 'Ngày 12', 'Ngày 13', 'Ngày 14', 'Ngày 15', 'Ngày 16', 'Ngày 17', 'Ngày 18', 'Ngày 19', 'Ngày 20', 'Ngày 21', 'Ngày 22', 'Ngày 23', 'Ngày 24', 'Ngày 25', 'Ngày 26', 'Ngày 27', 'Ngày 28', 'Ngày 29', 'Ngày 30']);
    } else if(range === "last1year") {
      setData([100, 200, 150, 300, 250, 400, 350, 120, 220, 180, 320, 270]);
      setLabels(['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']);
    }
  }, [range]);

  //CHon chart tuong ung
  const chartType = range === "last1year" ? "line" : range === "last30days" ? "bar" : "bar";
  const chartOptions = {
    title: {
      text: `Doanh thu ${rangeLabel[range]}`,
      left: 'center',
      top: 20,
    },
    tooltip: {
      trigger: 'axis', //hover theo trục x hiển thị dữ liệu
      formatter: (params) =>  //định dạng dữ liệu
        `${params[0].name}: ${params[0].value.toLocaleString()} VND`
    },

    xAxis: { //trực x hiển thị label
      type: 'category',
      data: labels,
    },

    yAxis: { //trục y hiển thị giá trị
      type: 'value',
      axisLabel: {
        formatter: (value) => `${value / 1000}K VND`
      }
    },

    series: [ //dữ liệu biểu đồ
      {
        data: data,
        type: chartType,
        smooth: chartType === "line",
      }
    ]
  };


  const handleRangeChange = (e) => {
    setRange(e.target.value);
  }
  //loại biểu đồ
  const typeChart = {
    tooltip: {trigger: 'axis'},
    xAxis: {}
  }
  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
        <h2 className="text-xl font-bold">Thống kê doanh thu</h2>
        <select className="border border-gray-300 rounded-md p-2"
        value={range}
        onChange={handleRangeChange}>
          <option value="last7days">7 ngày qua</option>
          <option value="last30days">30 ngày qua</option>
          <option value="last1year">1 năm qua</option>
        </select>
      </div>

      {/* Hiển thị biểu đồ */}
      <div>
        <ReactECharts option={chartOptions} style={{ height: '400px' }} />
      </div>
    </div>
  )
}

export default RevenueChart
