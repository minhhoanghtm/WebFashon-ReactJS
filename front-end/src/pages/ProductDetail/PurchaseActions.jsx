import React from "react";
import { Link } from "react-router-dom";

const PurchaseActions = () => {
  return (
    <div className="sticky bottom-0 grid grid-cols-2 bg-white border-t w-full items-center justify-center z-50 mt-20">
      <Link
        to="/cart"
        className="py-5 pl-5 border-r border-gray-300 rounded-l-lg hover:bg-black hover:text-white"
      >
        Thêm vào giỏ hàng (1)
      </Link>
      <Link
        to="/checkout"
        className="py-5 pl-5 rounded-r-lg bg-black text-white hover:bg-white hover:text-black"
      >
        Mua ngay <span>(200.000đ)</span>
      </Link>
    </div>
  );
};

export default PurchaseActions;
