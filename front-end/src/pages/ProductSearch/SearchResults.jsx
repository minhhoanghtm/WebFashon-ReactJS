import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ProductCard from "../../components/ProductCard";
import { Pagination } from "antd";

const SearchResults = () => {
   const [currentPage, setCurrentPage] = useState(1);
   const pageSize = 5; // Số sản phẩm hiển thị trên mỗi trang
   const params = useLocation();
   const navigate = useNavigate();
  const data = [
    {
      name: "Đồng hồ nam cao cấp",
      displayProduct: [
        "https://cdn.kkfashion.vn/24416-large_default/dam-chu-a-lien-than-cong-so-co-tron-kk161-04.jpg",
      ],
      category_id: "65f1a1b2c3d4e5f678901236",
      slug: "dong-ho-nam-cao-cap",
      description: "Đồng hồ sang trọng",
      old_price: 2500000,
      new_price: 1800000,
      sold: 120,
      rating: 4.5,
      is_active: true,
    },
    {
      name: "Đồng hồ nam thể thao",
      displayProduct: [
        "https://cdn.kkfashion.vn/24416-large_default/dam-chu-a-lien-than-cong-so-co-tron-kk161-04.jpg",
      ],
      category_id: "65f1a1b2c3d4e5f678901236",
      slug: "dong-ho-nam-the-thao",
      description: "Phong cách năng động",
      old_price: 1500000,
      new_price: 1200000,
      sold: 80,
      rating: 4.1,
      is_active: true,
    },
    {
      name: "Đồng hồ nam dây da",
      displayProduct: [
        "https://cdn.kkfashion.vn/24416-large_default/dam-chu-a-lien-than-cong-so-co-tron-kk161-04.jpg",
      ],
      category_id: "65f1a1b2c3d4e5f678901236",
      slug: "dong-ho-nam-day-da",
      description: "Thiết kế cổ điển",
      old_price: 1800000,
      new_price: 1400000,
      sold: 60,
      rating: 4.3,
      is_active: true,
    },
    {
      name: "Đồng hồ nam dây kim loại",
      displayProduct: [
        "https://cdn.kkfashion.vn/24416-large_default/dam-chu-a-lien-than-cong-so-co-tron-kk161-04.jpg",
      ],
      category_id: "65f1a1b2c3d4e5f678901236",
      slug: "dong-ho-nam-day-kim-loai",
      description: "Bền bỉ, sang trọng",
      old_price: 2200000,
      new_price: 1700000,
      sold: 95,
      rating: 4.6,
      is_active: true,
    },
    {
      name: "Đồng hồ nam chống nước",
      displayProduct: [
        "https://cdn.kkfashion.vn/24416-large_default/dam-chu-a-lien-than-cong-so-co-tron-kk161-04.jpg",
      ],
      category_id: "65f1a1b2c3d4e5f678901236",
      slug: "dong-ho-nam-chong-nuoc",
      description: "Phù hợp đi bơi",
      old_price: 2000000,
      new_price: 1600000,
      sold: 110,
      rating: 4.4,
      is_active: true,
    },
    {
      name: "Đồng hồ nam giá rẻ",
      displayProduct: [
        "https://cdn.kkfashion.vn/24416-large_default/dam-chu-a-lien-than-cong-so-co-tron-kk161-04.jpg",
      ],
      category_id: "65f1a1b2c3d4e5f678901236",
      slug: "dong-ho-nam-gia-re",
      description: "Giá tốt, chất lượng ổn",
      old_price: 1000000,
      new_price: 700000,
      sold: 200,
      rating: 3.9,
      is_active: true,
    },
    {
      name: "Đồng hồ nam thời trang",
      displayProduct: [
        "https://cdn.kkfashion.vn/24416-large_default/dam-chu-a-lien-than-cong-so-co-tron-kk161-04.jpg",
      ],
      category_id: "65f1a1b2c3d4e5f678901236",
      slug: "dong-ho-nam-thoi-trang",
      description: "Phong cách hiện đại",
      old_price: 1700000,
      new_price: 1300000,
      sold: 75,
      rating: 4.2,
      is_active: true,
    },
    {
      name: "Đồng hồ nam cao cấp mạ vàng",
      displayProduct: [
        "https://cdn.kkfashion.vn/24416-large_default/dam-chu-a-lien-than-cong-so-co-tron-kk161-04.jpg",
      ],
      category_id: "65f1a1b2c3d4e5f678901236",
      slug: "dong-ho-nam-ma-vang",
      description: "Sang trọng, đẳng cấp",
      old_price: 3000000,
      new_price: 2500000,
      sold: 40,
      rating: 4.7,
      is_active: true,
    },
    {
      name: "Đồng hồ nam đơn giản",
      displayProduct: [
        "https://cdn.kkfashion.vn/24416-large_default/dam-chu-a-lien-than-cong-so-co-tron-kk161-04.jpg",
      ],
      category_id: "65f1a1b2c3d4e5f678901236",
      slug: "dong-ho-nam-don-gian",
      description: "Thiết kế tối giản",
      old_price: 1200000,
      new_price: 900000,
      sold: 65,
      rating: 4.0,
      is_active: true,
    },
    {
      name: "Đồng hồ nam lịch lãm",
      displayProduct: [
        "https://cdn.kkfashion.vn/24416-large_default/dam-chu-a-lien-than-cong-so-co-tron-kk161-04.jpg",
      ],
      category_id: "65f1a1b2c3d4e5f678901236",
      slug: "dong-ho-nam-lich-lam",
      description: "Phong cách doanh nhân",
      old_price: 2700000,
      new_price: 2100000,
      sold: 55,
      rating: 4.6,
      is_active: true,
    },
  ];

  const onChange = (page) => {
  const newParams = new URLSearchParams(params.search);
  newParams.set("page", page);
    console.log(page);
    setCurrentPage(page);
    navigate({ search: newParams.toString() });
  }
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = data.slice(startIndex, endIndex);
  return (
    <div className="p-4">
        <h1 cla>Tìm thấy <span className="font-bold">{data.length}</span> sản phẩm phù hợp với từ khóa <span className="font-bold">"đồng hồ nam"</span>:</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5">
            {currentData.map((product, index) => (
                <Link key={product?._id || index} to={`/products/${product.slug}`}>
                    <ProductCard product={product} />
                </Link>
            ))};
        </div>
        <Pagination current={currentPage} pageSize={pageSize} total={data.length} onChange={onChange} />
    </div>
  );
};

export default SearchResults;
