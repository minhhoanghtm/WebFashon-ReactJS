import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { CgDetailsMore } from "react-icons/cg";
import { getAllCategoriesApi } from "@/api/categoryApi";

const minPrice = 0;
const maxPrice = 1000000;

const FilterProduct = ({ onFilter }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRating, setSelectedRating] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getAllCategoriesApi();
        if (res.data && Array.isArray(res.data)) {
          setCategories(res.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // kéo slider
  const handleRangeChange = (e) => {
    const value = Number(e.target.value);
    setPriceRange([minPrice, value]);
  };

  // nhập input giá
  const handlePriceInputChange = (e) => {
    let value = Number(e.target.value);
    if (value < minPrice) value = minPrice;
    if (value > maxPrice) value = maxPrice;
    setPriceRange([minPrice, value]);
  };

  // Xử lý category change
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // Xử lý rating change
  const handleRatingChange = (e) => {
    setSelectedRating(e.target.value === "allRatings" ? null : Number(e.target.value));
  };

  // Nhấn nút Lọc
  const handleApplyFilter = () => {
    const filters = {
      category: selectedCategory === "all" ? null : selectedCategory,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      rating: selectedRating,
    };
    onFilter(filters);
    setShowFilter(false);
  };

  // Nhấn nút Hủy
  const handleReset = () => {
    setPriceRange([minPrice, maxPrice]);
    setSelectedCategory("all");
    setSelectedRating(null);
    onFilter({
      category: null,
      minPrice: minPrice,
      maxPrice: maxPrice,
      rating: null,
    });
    setShowFilter(false);
  };

  return (
    <div className="border rounded-2xl max-w-md mx-5 my-10 px-5 py-10">
      {/* Title  */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
        <h1 className="text-2xl font-bold">Lọc sản phẩm</h1>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="bg-black text-white px-4 py-2 rounded-2xl"
        >
          <CgDetailsMore />
        </button>
      </div>

      {/* Filter options  */}
      {showFilter && (
        <div className="mt-5">
          {/* Danh mục */}
          <div className="mt-5">
            <h2 className="font-bold">Danh mục</h2>

            <div className="flex gap-2">
              <input
                type="radio"
                name="category"
                value="all"
                checked={selectedCategory === "all"}
                onChange={handleCategoryChange}
              />
              <label>Tất cả</label>
            </div>

            {loadingCategories ? (
              <p className="text-gray-500 text-sm">Đang tải danh mục...</p>
            ) : (
              categories.map((item) => (
                <div key={item._id} className="flex gap-2">
                  <input
                    type="radio"
                    name="category"
                    value={item._id}
                    checked={selectedCategory === item._id}
                    onChange={handleCategoryChange}
                  />
                  <label>{item.name}</label>
                </div>
              ))
            )}
          </div>

          <hr className="my-5 h-[2px] bg-gradient-to-r from-transparent via-black to-transparent border-0" />

          {/* Giá */}
          <div className="mt-5">
            <h2 className="font-bold">Giá</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <label>{minPrice.toLocaleString("vi-VN")}</label>
              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                value={priceRange[1]}
                onChange={handleRangeChange}
                className="flex-1"
              />
              <label>{maxPrice.toLocaleString("vi-VN")}</label>
              <input
                type="number"
                min={minPrice}
                max={maxPrice}
                value={priceRange[1]}
                onChange={handlePriceInputChange}
                className="border rounded-2xl border-black px-2.5 w-28"
              />
            </div>
          </div>

          <hr className="my-5 h-[2px] bg-gradient-to-r from-transparent via-black to-transparent border-0" />

          {/* Rating  */}
          <div>
            <h2 className="font-bold">Đánh giá</h2>
            <div>
              <div className="flex items-center">
                <input
                  type="radio"
                  name="rating"
                  value="allRatings"
                  checked={selectedRating === null}
                  onChange={handleRatingChange}
                  className="mr-2"
                />
                <label>Tất cả</label>
              </div>
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rating"
                    value={star}
                    checked={selectedRating === star}
                    onChange={handleRatingChange}
                  />
                  {(() => {
                    const stars = [];
                    for (let i = 0; i < star; i++) {
                      stars.push(<FaStar key={i} color="#ffc107" />);
                    }
                    return stars;
                  })()}
                </div>
              ))}
            </div>
          </div>

          <hr className="my-5 h-[2px] bg-gradient-to-r from-transparent via-black to-transparent border-0" />

          {/* nút  */}
          <div className="flex items-center justify-end gap-2 mt-5 flex-wrap">
            <button
              onClick={handleApplyFilter}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Lọc
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterProduct;
