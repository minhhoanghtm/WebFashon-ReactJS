import { useMemo, useState } from "react";
import Markdown from "@/components/Markdown";
const fallbackPolicy =
  "Hỗ trợ đổi trả theo chính sách của cửa hàng. Sản phẩm cần còn nguyên tem mác, chưa qua sử dụng và được gửi yêu cầu trong thời gian quy định.";

const ProductTabs = ({ product, variants = [] }) => {
  const [activeTab, setActiveTab] = useState("description");

  const detailRows = useMemo(() => {
    const rows = [
      ["Mã sản phẩm", product.sku],
      ["Danh mục", product.category],
      ["Tình trạng", product.stockLabel],
      ["Số lượng còn lại", product.stock !== null ? `${product.stock}` : ""],
      ["Màu sắc", [...new Set(variants.map((variant) => variant.color).filter(Boolean))].join(", ")],
      ["Kích thước", [...new Set(variants.map((variant) => variant.size).filter(Boolean))].join(", ")],
    ];

    return rows.filter(([, value]) => value !== undefined && value !== null && value !== "");
  }, [product, variants]);

  const tabs = [
    { id: "description", label: "Mô tả sản phẩm" },
    { id: "information", label: "Thông tin sản phẩm" },
    { id: "policy", label: "Chính sách đổi trả" },
  ];

  return (
    <section className="product-tabs" aria-label="Thông tin chi tiết sản phẩm">
      <div className="product-tabs__nav" role="tablist">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={activeTab === tab.id ? "is-active" : ""}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="product-tabs__panel">
        {activeTab === "description" && (
          <div className="product-tabs__copy">
            <h2>Mô tả sản phẩm</h2>
            <Markdown>{product.description}</Markdown>
          </div>
        )}

        {activeTab === "information" && (
          <div className="product-tabs__copy">
            <h2>Thông tin sản phẩm</h2>
            {detailRows.length ? (
              <div className="product-tabs__specs">
                {detailRows.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p>Thông tin sản phẩm đang được cập nhật.</p>
            )}
          </div>
        )}

        {activeTab === "policy" && (
          <div className="product-tabs__copy">
            <h2>Chính sách đổi trả</h2>
            <p>{fallbackPolicy}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductTabs;
