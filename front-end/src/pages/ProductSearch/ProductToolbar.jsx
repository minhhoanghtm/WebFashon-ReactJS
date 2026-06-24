import { Search, X } from "lucide-react";

const ProductToolbar = ({
  count,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  isUsingFallback,
  hasApiError,
}) => {
  return (
    <div className="product-toolbar">
      <div className="product-toolbar__top">
        <div>
          <strong>{count}</strong> sản phẩm được tìm thấy
          {isUsingFallback && (
            <span className="product-toolbar__source">
              {hasApiError
                ? "Đang hiển thị bộ sưu tập gợi ý"
                : "Bộ sưu tập gợi ý"}
            </span>
          )}
        </div>

        <label className="product-sort">
          <span>Sắp xếp theo</span>
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value)}
          >
            <option value="default">Mặc định</option>
            <option value="popular">Phổ biến</option>
            <option value="price_asc">Giá thấp đến cao</option>
            <option value="price_desc">Giá cao đến thấp</option>
            <option value="name_asc">Tên A-Z</option>
            <option value="newest">Mới nhất</option>
          </select>
        </label>
      </div>

      <label className="product-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          aria-label="Tìm kiếm trong danh sách sản phẩm"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Xóa từ khóa tìm kiếm"
          >
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </label>
    </div>
  );
};

export default ProductToolbar;
