import React from 'react'
import { FaDollarSign, FaShoppingCart, FaUsers } from "react-icons/fa";
import { AiFillProduct } from "react-icons/ai";
const KPIChart = () => {
    const cartData = [
        { name: 'Tổng doanh thu', value: 400, description: 'January' },
        { name: 'Tổng đơn hàng', value: 300, description: 'February' },
        { name: 'Tổng khách hàng', value: 500, description: 'March' },
        { name: 'Giá trị trung bình đơn hàng', value: 200, description: 'April' },
        { name: 'Số lượng sản phẩm đã bán', value: 600, description: 'May' }
    ];
    const iconMap = {
        'Tổng doanh thu': <FaDollarSign />,
        'Tổng đơn hàng': <FaShoppingCart />,
        'Tổng khách hàng': <FaUsers />,
        'Giá trị trung bình đơn hàng': <FaDollarSign />,
        'Số lượng sản phẩm đã bán': <AiFillProduct />
    };
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Chỉ số KPI</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
      {cartData.length > 0 ? cartData.map((item, index) => (
        <div key={index} className="bg-white p-4 rounded-xl shadow-md">
          <div className='flex justify-between items-center mb-2'>
            <h3 className="text-lg font-bold">{item.name}</h3>
            <span>{iconMap[item.name]}</span>
          </div>
          <p className="text-2xl font-bold">{item.value.toLocaleString()}</p>
          <p className="text-sm text-green-500">{item.description}</p>
        </div>
      )) : 
      <p>Chưa có dữ liệu thống kê</p>}
    </div>
    </div>
  )
}

export default KPIChart
