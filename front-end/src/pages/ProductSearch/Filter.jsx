import { Dropdown } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import React from "react";

const Filter = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ===== ITEMS =====
  const priceItems = [
    { key: "default", label: "Mặc định" },
    { key: "price_asc", label: "Thấp đến cao" },
    { key: "price_desc", label: "Cao đến thấp" },
  ];

  const bestSellerItems = [
    { key: "default", label: "Mặc định" },
    { key: "sold_desc", label: "Bán chạy nhất" },
  ];

  const ratingItems = [
    { key: "default", label: "Mặc định" },
    { key: "positive", label: "Đánh giá tích cực" },
  ];

  // ===== GET PARAMS =====
  const params = new URLSearchParams(location.search);

  const getLabel = (items, key) => {
    return items.find((item) => item.key === key)?.label;
  };

  // ===== HANDLE CHANGE =====
  const handleFilterChange = (type) => ({ key }) => {
    const newParams = new URLSearchParams(location.search);

    newParams.set(type, key);

    navigate(`/product-search?${newParams.toString()}`);
  };

  const currentPrice = params.get("price") || "default";
  const currentSort = params.get("sort") || "default";
  const currentRating = params.get("rating") || "default";

  return (
    <div className="flex justify-start items-center gap-4 px-5 py-3">
      {/* PRICE */}
      <Dropdown
        menu={{
          items: priceItems,
          onClick: handleFilterChange("price"),
        }}
      >
        <button className="border rounded-lg px-4 py-2">
          {getLabel(priceItems, currentPrice)}
        </button>
      </Dropdown>

      {/* BEST SELLER */}
      <Dropdown
        menu={{
          items: bestSellerItems,
          onClick: handleFilterChange("sort"),
        }}
      >
        <button className="border rounded-lg px-4 py-2">
          {getLabel(bestSellerItems, currentSort)}
        </button>
      </Dropdown>

      {/* RATING */}
      <Dropdown
        menu={{
          items: ratingItems,
          onClick: handleFilterChange("rating"),
        }}
      >
        <button className="border rounded-lg px-4 py-2">
          {getLabel(ratingItems, currentRating)}
        </button>
      </Dropdown>
    </div>
  );
};

export default Filter;