import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Eye, Check, ArrowRight, Plus } from "lucide-react";
import { useCartStore } from "../../stores/cartStore";
import { SafeImage } from "../ui/SafeImage";

export function LookbookHotspots() {
  const [activePin, setActivePin] = useState(0); // 0, 1, 2
  const [addedId, setAddedId] = useState(null);

  const addItem = useCartStore((state) => state.addItem);

  const hotspotItems = [
    {
      id: "hotspot-1",
      name: "Áo Blazer Len Ý Cấu Trúc Atelier",
      price: 1850000,
      image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&q=80",
      top: "28%",
      left: "54%",
      category: "Áo khoác",
      slug: "ao-blazer-len-y-cau-truc",
    },
    {
      id: "hotspot-2",
      name: "Quần Tây Xếp Ly Đôi Form Rộng",
      price: 1150000,
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80",
      top: "65%",
      left: "48%",
      category: "Quần may đo",
      slug: "quan-tay-xep-ly-doi",
    },
    {
      id: "hotspot-3",
      name: "Túi Đeo Chéo Da Bò Mộc Toscana",
      price: 1450000,
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
      top: "48%",
      left: "68%",
      category: "Phụ kiện da",
      slug: "tui-deo-cheo-da-bo-moc",
    },
  ];

  const handleAddToCart = (item) => {
    addItem({
      id: item.id,
      productId: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  const currentItem = hotspotItems[activePin];

  return (
    <section className="py-16 sm:py-24 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full border-b border-[rgba(244,240,232,0.1)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-[rgba(244,240,232,0.1)]">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block mb-1">
            SHOP THE EDITORIAL LOOK
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f0e8]">
            SHOPPABLE LOOKBOOK HOTSPOTS
          </h2>
        </div>
        <p className="text-xs text-[#9a989f] max-w-sm">
          Nhấp vào các điểm gắn (pins) trên người mẫu để khám phá chi tiết từng món đồ trong outfit và mua ngay tức thì.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Lookbook Photo with Hotspot Pins */}
        <div className="lg:col-span-8 relative aspect-[4/5] sm:aspect-[16/11] bg-[#161619] border border-[rgba(244,240,232,0.15)] overflow-hidden">
          <SafeImage
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80"
            alt="Editorial Shoppable Lookbook"
            className="w-full h-full object-cover grayscale-[15%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e]/80 via-transparent to-transparent pointer-events-none" />

          {/* Interactive Pins */}
          {hotspotItems.map((item, idx) => {
            const isActive = activePin === idx;
            return (
              <button
                key={item.id}
                onClick={() => setActivePin(idx)}
                style={{ top: item.top, left: item.left }}
                aria-label={`Xem sản phẩm: ${item.name}`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-[#e65100] scale-125 shadow-[0_0_15px_rgba(230,81,0,0.8)]"
                    : "bg-[#0c0c0e]/80 hover:bg-[#e65100] border border-white/40"
                }`}
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff6d00] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
              </button>
            );
          })}

          {/* Desktop Floating Popover Card */}
          <div className="hidden sm:block absolute bottom-6 left-6 z-20 max-w-xs bg-[#121215]/95 backdrop-blur-md border border-[rgba(244,240,232,0.15)] p-4 shadow-2xl animate-fade-in">
            <span className="text-[10px] font-mono tracking-widest text-[#e65100] uppercase block mb-1">
              {currentItem.category}
            </span>
            <h4 className="font-display text-sm font-bold text-[#f4f0e8] line-clamp-1 mb-1">
              {currentItem.name}
            </h4>
            <div className="text-xs font-mono text-[#ff6d00] font-semibold mb-3">
              {currentItem.price.toLocaleString("vi-VN")} ₫
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddToCart(currentItem)}
                className="flex-1 min-h-[38px] px-3 bg-[#e65100] hover:bg-[#ff6d00] text-white text-[11px] font-display uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                {addedId === currentItem.id ? (
                  <>
                    <Check size={13} />
                    <span>Đã Thêm</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={13} />
                    <span>Thêm Vào Giỏ</span>
                  </>
                )}
              </button>
              <Link
                to={`/product/${currentItem.slug}`}
                className="min-h-[38px] px-3 bg-white/10 hover:bg-white/20 text-[#f4f0e8] text-[11px] flex items-center justify-center transition-colors"
                title="Xem chi tiết"
              >
                <Eye size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Outfit Items Ledger (Great for all viewports) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest text-[#e65100]">
              TRỌN BỘ OUTFIT #04
            </span>
            <h3 className="font-display text-xl font-bold uppercase text-[#f4f0e8]">
              CÁC MÓN ĐỒ TRONG HÌNH
            </h3>
          </div>

          <div className="space-y-3">
            {hotspotItems.map((item, idx) => {
              const isSelected = activePin === idx;
              return (
                <div
                  key={item.id}
                  onClick={() => setActivePin(idx)}
                  className={`p-3 bg-[#161619] border transition-all cursor-pointer flex items-center gap-3.5 ${
                    isSelected
                      ? "border-[#e65100] bg-[#1c1d22]"
                      : "border-[rgba(244,240,232,0.1)] hover:border-white/20"
                  }`}
                >
                  <div className="w-14 h-18 bg-[#0c0c0e] shrink-0 overflow-hidden">
                    <SafeImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono text-[#9a989f] uppercase block">
                      {item.category}
                    </span>
                    <h5 className="font-display text-xs font-bold text-[#f4f0e8] truncate">
                      {item.name}
                    </h5>
                    <span className="text-xs font-mono text-[#e65100] font-semibold">
                      {item.price.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(item);
                    }}
                    className="w-8 h-8 rounded-full bg-[#202025] hover:bg-[#e65100] text-[#f4f0e8] flex items-center justify-center shrink-0 transition-colors"
                    title="Thêm vào giỏ"
                  >
                    {addedId === item.id ? <Check size={13} className="text-emerald-400" /> : <Plus size={14} />}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <Link
              to="/lookbooks"
              className="inline-flex items-center gap-2 text-xs font-display tracking-widest uppercase text-[#9a989f] hover:text-[#f4f0e8] transition-colors"
            >
              <span>Xem Thêm Các Bộ Phối Lookbook</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
