import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-black text-red-500">404</h1>
      <p className="mt-4 text-xl font-bold text-gray-800">Không tìm thấy trang</p>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-md"
      >
        Quay lại trang chủ
      </Link>
    </div>
  );
};

export default NotFound;
