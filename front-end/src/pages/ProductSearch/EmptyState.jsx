import { LoaderCircle, PackageSearch } from "lucide-react";

const EmptyState = ({ type, onClear }) => {
  if (type === "loading") {
    return (
      <div className="product-state" role="status">
        <LoaderCircle
          className="product-state__loader"
          size={28}
          aria-hidden="true"
        />
        <span>Đang tải sản phẩm...</span>
      </div>
    );
  }

  return (
    <div className="product-state">
      <PackageSearch size={34} aria-hidden="true" />
      <h2>Không tìm thấy sản phẩm phù hợp</h2>
      <p>Hãy thử từ khóa khác hoặc xóa các điều kiện đang chọn.</p>
      {onClear && (
        <button type="button" onClick={onClear}>
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
};

export default EmptyState;
