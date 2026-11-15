import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Check, Sparkles, Plus, ArrowRight } from "lucide-react";
import { productApi } from "../../api/endpoints";
import { useCartStore } from "../../stores/cartStore";
import { Button } from "../ui/Button";
import { SafeImage } from "../ui/SafeImage";

export function CompleteTheLook({ currentProduct }) {
  const [bundleProducts, setBundleProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const addMultipleItems = useCartStore((state) => state.addMultipleItems);

  useEffect(() => {
    let active = true;
    async function loadComplementary() {
      if (!currentProduct) return;
      setIsLoading(true);
      try {
        const res = await productApi.getAll({ limit: 6 });
        const list = res.data || res || [];
        if (active && Array.isArray(list)) {
          // Filter out current product and pick up to 2 complementary pieces
          const complements = list
            .filter((p) => p._id !== currentProduct._id)
            .slice(0, 2);

          const fullOutfit = [currentProduct, ...complements];
          setBundleProducts(fullOutfit);
          setSelectedIds(fullOutfit.map((p) => p._id));
        }
      } catch (err) {
        console.error("CompleteTheLook fetch error:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadComplementary();
    return () => {
      active = false;
    };
  }, [currentProduct?._id]);

  if (isLoading || bundleProducts.length < 2) {
    return null; // Don't show if no bundle items available
  }

  const toggleItem = (id) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) return; // Keep at least 1 item
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedItems = bundleProducts.filter((p) => selectedIds.includes(p._id));
  const rawTotal = selectedItems.reduce(
    (sum, p) => sum + (p.price || p.new_price || 0),
    0
  );
  // 10% discount when buying 2 or more bundle items
  const discountRate = selectedItems.length >= 2 ? 0.1 : 0;
  const bundleSavings = Math.round(rawTotal * discountRate);
  const finalBundlePrice = rawTotal - bundleSavings;

  const handleAddBundleToCart = async () => {
    const itemsToAdd = selectedItems.map((p) => {
      const img =
        p.displayProduct?.[0] ||
        p.displayProduct ||
        p.images?.[0] ||
        p.image ||
        "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80";

      return {
        id: p._id,
        productId: p._id,
        name: p.name,
        price: p.price || p.new_price || 0,
        image: img,
        quantity: 1,
      };
    });

    await addMultipleItems(itemsToAdd);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2500);
  };

  return (
    <section data-testid="complete-the-look" className="mt-16 pt-12 border-t border-[rgba(244,240,232,0.12)]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-[#e65100]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#e65100]">
              STYLING ATELIER • GỢI Ý PHỐI TRỌN BỘ
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#f4f0e8] tracking-tight">
            COMPLETE THE LOOK
          </h2>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono text-[#9a989f] block">
            Ưu đãi mua theo set
          </span>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 inline-block mt-0.5">
            TIẾT KIỆM 10% TRỌN BỘ
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Product Cards Row */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {bundleProducts.map((p, idx) => {
            const isSelected = selectedIds.includes(p._id);
            const isMain = p._id === currentProduct._id;
            const price = p.price || p.new_price || 0;
            const img =
              p.displayProduct?.[0] ||
              p.displayProduct ||
              p.images?.[0] ||
              p.image ||
              "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80";

            return (
              <div
                key={p._id}
                onClick={() => toggleItem(p._id)}
                className={`relative flex flex-col p-3 border transition-all cursor-pointer select-none ${
                  isSelected
                    ? "border-[#e65100] bg-[#161619]"
                    : "border-white/10 bg-[#121215] opacity-50 hover:opacity-80"
                }`}
              >
                {/* Select Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <div
                    className={`w-5 h-5 flex items-center justify-center border transition-colors ${
                      isSelected
                        ? "bg-[#e65100] border-[#e65100] text-white"
                        : "border-white/30 bg-[#0c0c0e]"
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                  </div>
                </div>

                {isMain && (
                  <span className="absolute top-4 right-4 z-10 px-2 py-0.5 text-[9px] font-mono font-bold bg-[#0c0c0e]/80 text-[#e65100] border border-[#e65100]/40 uppercase">
                    Đang xem
                  </span>
                )}

                <div className="aspect-[3/4] overflow-hidden bg-[#0c0c0e] mb-3">
                  <SafeImage
                    src={img}
                    alt={p.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <h4 className="font-display text-xs text-[#f4f0e8] line-clamp-1 mb-1">
                    {p.name}
                  </h4>
                  <span className="font-mono text-xs font-semibold text-[#f4f0e8]">
                    {price.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bundle Summary & CTA */}
        <div className="lg:col-span-4 p-6 bg-[#161619] border border-[rgba(244,240,232,0.15)] flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#9a989f] block mb-1">
              TỔNG KẾT OUTFIT ({selectedItems.length} MÓN)
            </span>
            <div className="space-y-2 py-3 border-y border-white/10 text-xs">
              <div className="flex justify-between text-[#9a989f]">
                <span>Giá gốc từng món:</span>
                <span className="font-mono">{rawTotal.toLocaleString("vi-VN")} ₫</span>
              </div>
              {bundleSavings > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Ưu đãi trọn bộ (10%):</span>
                  <span className="font-mono">-{bundleSavings.toLocaleString("vi-VN")} ₫</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-white/5">
                <span className="font-display text-sm uppercase text-[#f4f0e8]">
                  Tổng giá set:
                </span>
                <span className="font-display text-xl font-bold text-[#f4f0e8]">
                  {finalBundlePrice.toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>
          </div>

          <Button
            variant={isAdded ? "primary" : "signal"}
            size="lg"
            data-testid="bundle-add-btn"
            className="w-full gap-2 py-4"
            onClick={handleAddBundleToCart}
          >
            {isAdded ? (
              <>
                <Check size={18} className="text-emerald-400" />
                <span>Đã Thêm {selectedItems.length} Món Vào Giỏ!</span>
              </>
            ) : (
              <>
                <ShoppingBag size={18} />
                <span>Thêm Trọn Bộ Vào Giỏ Hàng</span>
              </>
            )}
          </Button>

          <p className="text-[11px] text-[#6b6973] text-center leading-relaxed">
            * Các món trong set được áp dụng chính sách đổi trả size 7 ngày miễn phí riêng lẻ theo từng sản phẩm.
          </p>
        </div>
      </div>
    </section>
  );
}
