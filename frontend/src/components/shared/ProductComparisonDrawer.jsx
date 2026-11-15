import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Scale, X, ShoppingBag, Check, ChevronUp, ChevronDown, Trash2, ArrowRight } from "lucide-react";
import { useCompareStore } from "../../stores/compareStore";
import { useCartStore } from "../../stores/cartStore";
import { Button } from "../ui/Button";

export function ProductComparisonDrawer() {
  const items = useCompareStore((state) => state.items);
  const isDrawerOpen = useCompareStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useCompareStore((state) => state.setDrawerOpen);
  const removeCompare = useCompareStore((state) => state.removeCompare);
  const clearCompare = useCompareStore((state) => state.clearCompare);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState([]);

  const addItem = useCartStore((state) => state.addItem);

  if (items.length === 0) return null;

  const handleAddToCart = (product) => {
    const img =
      product.displayProduct?.[0] ||
      product.displayProduct ||
      product.images?.[0] ||
      product.image ||
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80";

    addItem({
      id: product._id,
      productId: product._id,
      name: product.name,
      price: product.price || product.new_price || 0,
      image: img,
      quantity: 1,
    });

    setAddedItemIds((prev) => [...prev, product._id]);
    setTimeout(() => {
      setAddedItemIds((prev) => prev.filter((id) => id !== product._id));
    }, 2000);
  };

  return (
    <>
      {/* 1. Floating Bottom Dock */}
      <div data-testid="compare-dock" className="fixed bottom-0 inset-x-0 z-40 bg-[#0c0c0e]/95 backdrop-blur-xl border-t border-[rgba(244,240,232,0.2)] shadow-2xl py-3 px-4 sm:px-8 animate-slide-up">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Scale size={18} className="text-[#e65100]" />
              <span className="font-display text-xs uppercase tracking-wider text-[#f4f0e8] font-bold">
                So Sánh ({items.length}/4)
              </span>
            </div>

            {/* Thumbnail Pills */}
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {items.map((p) => {
                const img =
                  p.displayProduct?.[0] ||
                  p.displayProduct ||
                  p.images?.[0] ||
                  p.image ||
                  "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80";

                return (
                  <div
                    key={p._id || p.id}
                    className="relative group w-9 h-11 border border-white/20 bg-[#161619] shrink-0"
                  >
                    <img src={img} alt={p.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeCompare(p._id || p.id)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Bỏ so sánh"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={clearCompare}
              className="text-xs font-mono text-[#9a989f] hover:text-white px-2 py-1"
            >
              Xóa tất cả
            </button>
            <Button
              variant="signal"
              size="sm"
              data-testid="compare-view-modal-btn"
              onClick={() => setIsModalOpen(true)}
              className="gap-1.5"
            >
              <span>Xem So Sánh Chi Tiết</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Full Comparison Modal */}
      {isModalOpen && (
        <div data-testid="compare-matrix-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#121215] border border-[rgba(244,240,232,0.2)] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale size={20} className="text-[#e65100]" />
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#f4f0e8]">
                    Bảng So Sánh Thiết Kế May Đo
                  </h3>
                  <p className="text-xs text-[#9a989f]">
                    Phân tích đa chiều về chất liệu, thông số và kỹ nghệ thủ công
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-[#9a989f] hover:text-white"
                aria-label="Đóng so sánh"
              >
                <X size={20} />
              </button>
            </div>

            {/* Comparison Matrix Table */}
            <div className="flex-1 overflow-x-auto p-4 sm:p-6">
              <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-4 px-3 text-[#9a989f] font-mono uppercase tracking-wider w-36">
                      Tiêu Chí
                    </th>
                    {items.map((p) => {
                      const img =
                        p.displayProduct?.[0] ||
                        p.displayProduct ||
                        p.images?.[0] ||
                        p.image ||
                        "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80";

                      return (
                        <th key={p._id || p.id} className="py-4 px-3 font-display text-center align-top min-w-[180px]">
                          <div className="aspect-[3/4] max-w-[140px] mx-auto bg-[#161619] border border-white/10 overflow-hidden mb-2 relative group">
                            <img src={img} alt={p.name} className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeCompare(p._id || p.id)}
                              className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Xóa khỏi so sánh"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <h4 className="text-xs uppercase text-[#f4f0e8] line-clamp-1 mb-1 font-semibold">
                            {p.name}
                          </h4>
                          <span className="font-mono text-sm text-[#e65100] font-bold block mb-2">
                            {(p.price || p.new_price || 0).toLocaleString("vi-VN")} ₫
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-3 px-3 font-mono text-[#9a989f] uppercase text-[11px]">Phân Khúc</td>
                    {items.map((p) => (
                      <td key={p._id || p.id} className="py-3 px-3 text-center text-[#f4f0e8]">
                        {p.category?.name || "Haute Atelier"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono text-[#9a989f] uppercase text-[11px]">Chất Liệu Chính</td>
                    {items.map((p) => (
                      <td key={p._id || p.id} className="py-3 px-3 text-center text-[#f4f0e8]">
                        {p.material || "Lụa Tơ Tằm / Dạ Cashmere Ý"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono text-[#9a989f] uppercase text-[11px]">Phom Dáng (Silhouette)</td>
                    {items.map((p) => (
                      <td key={p._id || p.id} className="py-3 px-3 text-center text-[#f4f0e8]">
                        {p.silhouette || "Tailored Architectural Cut"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono text-[#9a989f] uppercase text-[11px]">Nghệ Thuật Cắt May</td>
                    {items.map((p) => (
                      <td key={p._id || p.id} className="py-3 px-3 text-center text-[#9a989f]">
                        May đo giấu chỉ thủ công
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono text-[#9a989f] uppercase text-[11px]">Tình Trạng Kho</td>
                    {items.map((p) => (
                      <td key={p._id || p.id} className="py-3 px-3 text-center text-emerald-400 font-semibold">
                        Sẵn Sàng Giao
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-3 font-mono text-[#9a989f] uppercase text-[11px]">Hành Động</td>
                    {items.map((p) => {
                      const isAdded = addedItemIds.includes(p._id);
                      return (
                        <td key={p._id || p.id} className="py-4 px-3 text-center">
                          <Button
                            variant={isAdded ? "primary" : "signal"}
                            size="sm"
                            className="w-full text-xs gap-1"
                            onClick={() => handleAddToCart(p)}
                          >
                            {isAdded ? (
                              <>
                                <Check size={14} className="text-emerald-400" />
                                <span>Đã Thêm!</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag size={14} />
                                <span>Thêm Giỏ</span>
                              </>
                            )}
                          </Button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-[#0c0c0e]">
              <Button variant="secondary" size="md" data-testid="compare-close-modal-btn" onClick={() => setIsModalOpen(false)}>
                Đóng Bảng
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
