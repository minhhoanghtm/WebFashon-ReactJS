import React, { useMemo, useState } from "react";
import Markdown from "@/components/Markdown";

const fallbackPolicy =
  "Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày kể từ khi nhận hàng đối với sản phẩm còn nguyên tem mác, chưa qua sử dụng hoặc giặt tẩy. Miễn phí đổi hàng nếu có lỗi từ nhà sản xuất.";

const ProductTabs = ({ product, variants = [] }) => {
  const [activeTab, setActiveTab] = useState("description");

  const detailRows = useMemo(() => {
    const rows = [
      ["Mã sản phẩm", product.sku],
      ["Danh mục", product.category],
      ["Tình trạng", product.stockLabel],
      ["Số lượng kho", product.stock !== null ? `${product.stock}` : ""],
      ["Màu sắc có sẵn", [...new Set(variants.map((v) => v.color).filter(Boolean))].join(", ")],
      ["Kích thước có sẵn", [...new Set(variants.map((v) => v.size).filter(Boolean))].join(", ")],
    ];

    return rows.filter(([, value]) => value !== undefined && value !== null && value !== "");
  }, [product, variants]);

  const tabs = [
    { id: "description", label: "Mô tả sản phẩm" },
    { id: "information", label: "Thông số chi tiết" },
    { id: "policy", label: "Chính sách đổi trả" },
  ];

  return (
    <section className="product-tabs pt-10 mt-10 border-t border-neutral-200/80 w-full" aria-label="Thông tin chi tiết sản phẩm">
      {/* Tab Nav Buttons */}
      <div className="flex items-center gap-6 sm:gap-8 border-b border-neutral-200 overflow-x-auto pb-px" role="tablist">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "text-neutral-950 border-b-2 border-neutral-950"
                : "text-neutral-400 hover:text-neutral-700 border-b-2 border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="pt-6">
        {activeTab === "description" && (
          <div className="prose prose-neutral max-w-none text-sm text-neutral-600 leading-relaxed">
            {product.description ? (
              <Markdown>{product.description}</Markdown>
            ) : (
              <p className="italic text-neutral-400">Đang cập nhật mô tả chi tiết cho sản phẩm này.</p>
            )}
          </div>
        )}

        {activeTab === "information" && (
          <div className="max-w-xl">
            {detailRows.length > 0 ? (
              <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200/70 overflow-hidden bg-white shadow-2xs">
                {detailRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3 text-xs">
                    <span className="text-neutral-500 font-medium">{label}</span>
                    <strong className="text-neutral-900 font-bold">{value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400">Thông tin sản phẩm đang được cập nhật.</p>
            )}
          </div>
        )}

        {activeTab === "policy" && (
          <div className="max-w-2xl bg-neutral-50/80 rounded-2xl p-5 border border-neutral-200/60 text-xs sm:text-sm text-neutral-600 leading-relaxed">
            <h3 className="font-bold text-neutral-900 text-sm mb-2">Chính sách cam kết & đổi trả</h3>
            <p className="mb-3">{fallbackPolicy}</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-neutral-500">
              <li>Sản phẩm còn nguyên tem, mác, hóa đơn mua hàng.</li>
              <li>Chưa qua sử dụng, giặt ủi hoặc có mùi lạ.</li>
              <li>Hỗ trợ đổi kích cỡ hoặc đổi mẫu khác có giá trị tương đương hoặc cao hơn.</li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductTabs;
