
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
    </div>
  );
};

export default ProductToolbar;
