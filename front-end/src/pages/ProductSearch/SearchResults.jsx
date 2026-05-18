import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ProductCard from "../../components/ProductCard";
import { Pagination } from "antd";

const SearchResults = ({ products, loading, onSort, currentSort }) => {
  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-xl">
          ⏳ Đang tìm kiếm...
        </h1>
      </div>
    )
  }

  if(!products || products.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl">
          ❌ Không tìm thấy sản phẩm nào
        </h1>
      </div>
    )
  }
  const params = useLocation();
  const search = new URLSearchParams(params.search);
  const q = search.get("search") || "";
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // Số sản phẩm hiển thị trên mỗi trang
  const navigate = useNavigate();
  
  // Xử lý khi thay đổi sắp xếp
  const handleSortChange = (e) => {
    onSort(e.target.value);
    setCurrentPage(1); // Reset về trang 1
  };
  
  console.log(q);
  const onChange = (page) => {
    const newParams = new URLSearchParams(params.search);
    newParams.set("page", page);
    console.log(page);
    setCurrentPage(page);
    navigate({ search: newParams.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
  window.scrollTo({ top: 0, behavior: "smooth" });
}, [currentPage]);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = products.slice(startIndex, endIndex);
  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">
          Tìm thấy <span className="font-bold">{products.length}</span> sản phẩm
          {q && <span className="font-bold"> “{q}”</span>}
        </h1>
        <select 
          name="price" 
          id="price" 
          className="rounded-full border-2 border-black"
          value={currentSort}
          onChange={handleSortChange}
        >
          <option value="newest">Mặc định</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="rating">Đánh giá cao nhất</option>
        </select>
      </div>
      <div className="border rounded-2xl border-gray-300 grid grid-cols-2 md:grid-cols-4 gap-4 my-5 py-5 px-5">
        {currentData.map((product, index) => (
          <Link key={product?._id || index} to={`/products/${product.slug}`}>
            <ProductCard product={product} />
          </Link>
        ))}
        ;
      </div>
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={products.length}
        onChange={onChange}
      />
    </div>
  );
};

export default SearchResults;
