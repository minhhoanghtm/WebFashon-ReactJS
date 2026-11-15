import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2, ShoppingBag, ArrowRight, Check, Sparkles, Plus } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ProductCard } from "../../components/shared/ProductCard";
import { productApi } from "../../api/endpoints";
import { useCartStore } from "../../stores/cartStore";
import { SafeImage } from "../../components/ui/SafeImage";

export function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      try {
        const res = await productApi.getAll({ limit: 4 });
        const list = res.data || res || [];
        setFavorites(Array.isArray(list) ? list : []);
      } catch (e) {
        setFavorites([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadFavorites();
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="pb-6 border-b border-[rgba(244,240,232,0.1)] mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#f4f0e8]">
            THIẾT KẾ ĐÃ LƯU ({favorites.length})
          </h1>
        </div>
        <Link to="/products">
          <Button variant="secondary" size="sm">
            Xem Thêm Thiết Kế
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-[#161619] animate-pulse" />
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {favorites.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-[#121215] border border-white/10 space-y-4">
          <Heart size={32} className="mx-auto text-[#6b6973]" />
          <h3 className="font-display text-lg uppercase text-[#f4f0e8]">
            Bạn chưa lưu thiết kế nào
          </h3>
          <p className="text-xs text-[#9a989f]">
            Hãy dạo quanh bộ sưu tập và nhấn vào biểu tượng trái tim để lưu lại những mẫu trang phục yêu thích.
          </p>
          <Link to="/products">
            <Button variant="signal" size="md">
              Khám Phá Ngay
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export function Vouchers() {
  const [vouchers, setVouchers] = useState([
    {
      _id: "v1",
      code: "ATELIER100",
      discount: 100000,
      minOrder: 1000000,
      description: "Giảm 100.000 ₫ cho đơn hàng may đo từ 1.000.000 ₫",
      expiry: "31/12/2026",
      type: "order",
    },
    {
      _id: "v2",
      code: "FREESHIP",
      discount: 30000,
      minOrder: 500000,
      description: "Miễn phí vận chuyển toàn quốc cho đơn hàng từ 500.000 ₫",
      expiry: "31/12/2026",
      type: "shipping",
    },
    {
      _id: "v3",
      code: "VIPMEMBER",
      discount: 250000,
      minOrder: 2000000,
      description: "Đặc quyền thành viên: Giảm 250.000 ₫ cho BST Mới",
      expiry: "31/12/2026",
      type: "order",
    },
    {
      _id: "v4",
      code: "HAUTE50",
      discount: 50000,
      minOrder: 800000,
      description: "Giảm 50.000 ₫ trải nghiệm mua sắm đầu tiên",
      expiry: "31/12/2026",
      type: "order",
    },
  ]);

  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      <div className="pb-6 border-b border-[rgba(244,240,232,0.1)] flex justify-between items-end">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#f4f0e8]">
            VOUCHER & MÃ GIẢM GIÁ
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vouchers.map((v) => (
          <div
            key={v._id}
            className="p-6 bg-[#161619] border border-[rgba(244,240,232,0.12)] relative overflow-hidden flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-[#e65100]/20 text-[#ff6d00] border border-[#e65100]/40 px-2 py-0.5">
                  {v.type === "shipping" ? "FREESHIP" : "VOUCHER"}
                </span>
                <span className="text-[11px] font-mono text-[#9a989f]">
                  HSD: {v.expiry}
                </span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#f4f0e8]">
                {v.discount.toLocaleString("vi-VN")} ₫
              </h3>
              <p className="text-xs text-[#9a989f] leading-relaxed">
                {v.description}
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-[#f4f0e8] tracking-widest">
                {v.code}
              </span>
              <Button
                variant={copiedCode === v.code ? "primary" : "secondary"}
                size="sm"
                onClick={() => handleCopy(v.code)}
              >
                {copiedCode === v.code ? "Đã Sao Chép!" : "Sao Chép Mã"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Lookbooks() {
  const addItem = useCartStore((state) => state.addItem);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [addedHotspotId, setAddedHotspotId] = useState(null);

  const lookbookSets = [
    {
      id: "ch1",
      title: "Chương I: Monochrome Structure",
      subtitle: "Bộ sưu tập may đo đen tuyền và xám khoáng chất",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
      desc: "Nghiên cứu về tỉ lệ vai đệm dứt khoát và đường cắt ve áo tối giản mang cảm hứng kiến trúc Bauhaus.",
      hotspots: [
        {
          id: "hs-1",
          top: "28%",
          left: "48%",
          name: "Áo Blazer Wool Cashmere Đen Tuyền",
          price: 2450000,
          category: "Haute Blazer",
          slug: "ao-blazer-wool-cashmere",
        },
        {
          id: "hs-2",
          top: "62%",
          left: "52%",
          name: "Quần Trousers Ý Dáng Suông Xếp Ly",
          price: 1350000,
          category: "Tailored Pants",
          slug: "quan-trousers-y-dang-suong",
        },
      ],
    },
    {
      id: "ch2",
      title: "Chương II: Tactile Drapery",
      subtitle: "Nghệ thuật xếp nếp trên nền dạ Cashmere & Lụa Tơ Tằm",
      image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
      desc: "Sự mềm mại tương phản trên kết cấu phom đứng, tạo nên chuyển động thanh lịch theo từng bước chân.",
      hotspots: [
        {
          id: "hs-3",
          top: "32%",
          left: "45%",
          name: "Áo Dạ Silk Drape Cổ Thuyền Tối Giản",
          price: 1850000,
          category: "Silk Atelier",
          slug: "ao-da-silk-drape",
        },
        {
          id: "hs-4",
          top: "75%",
          left: "50%",
          name: "Chân Váy Dài Lụa Satin Cao Cấp",
          price: 1250000,
          category: "Skirt Collection",
          slug: "chan-vay-dai-lua-satin",
        },
      ],
    },
    {
      id: "ch3",
      title: "Chương III: Urban Resilience",
      subtitle: "Trang phục thường nhật cao cấp với chất liệu chống thấm",
      image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80",
      desc: "Đáp ứng nhịp sống đô thị hiện đại mà không đánh mất đi vẻ tinh xảo của thời trang may đo.",
      hotspots: [
        {
          id: "hs-5",
          top: "35%",
          left: "52%",
          name: "Áo Trench Coat Đô Thị Vải Chống Nước",
          price: 3200000,
          category: "Outerwear",
          slug: "ao-trench-coat-do-thi",
        },
      ],
    },
  ];

  const handleQuickAddHotspot = (spot, e) => {
    e.stopPropagation();
    addItem({
      id: spot.id,
      productId: spot.id,
      name: spot.name,
      price: spot.price,
      image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80",
      quantity: 1,
    });
    setAddedHotspotId(spot.id);
    setTimeout(() => setAddedHotspotId(null), 2000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-16">
      <div className="text-center space-y-3 pb-8 border-b border-white/10">
        <h1 className="font-display text-4xl sm:text-5xl font-bold uppercase text-[#f4f0e8]">
          LOOKBOOKS THEO MÙA
        </h1>
        <p className="text-xs text-[#9a989f] max-w-lg mx-auto">
          Chạm vào các điểm sáng trên ảnh để khám phá chi tiết và mua trực tiếp các thiết kế trong từng bức hình nghệ thuật.
        </p>
      </div>

      <div className="space-y-20">
        {lookbookSets.map((set, idx) => (
          <div
            key={set.id}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
              idx % 2 === 1 ? "lg:flex-row-reverse" : ""
            }`}
          >
            {/* Editorial Image with Pulsating Hotspots */}
            <div
              className={`lg:col-span-7 aspect-[16/10] overflow-hidden bg-[#161619] border border-white/10 relative ${
                idx % 2 === 1 ? "lg:order-2" : ""
              }`}
            >
              <SafeImage
                src={set.image}
                alt={set.title}
                className="w-full h-full object-cover object-center"
              />

              {/* Hotspots */}
              {set.hotspots.map((spot) => {
                const isActive = activeHotspot === spot.id;
                const isAdded = addedHotspotId === spot.id;

                return (
                  <div
                    key={spot.id}
                    className="absolute z-20"
                    style={{ top: spot.top, left: spot.left }}
                  >
                    {/* Pulsating Trigger Dot */}
                    <button
                      type="button"
                      onClick={() =>
                        setActiveHotspot(isActive ? null : spot.id)
                      }
                      className="relative flex items-center justify-center w-7 h-7 rounded-full bg-[#e65100] text-white shadow-lg transition-transform hover:scale-125 focus:outline-none"
                      title={spot.name}
                      aria-label={spot.name}
                    >
                      <span className="absolute inset-0 rounded-full bg-[#e65100] animate-ping opacity-75" />
                      <Plus size={14} className="relative z-10" />
                    </button>

                    {/* Popover Product Card */}
                    {isActive && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-9 w-60 sm:w-64 bg-[#121215]/95 backdrop-blur-md border border-[#e65100]/60 p-3 shadow-2xl z-30 animate-fade-in text-left">
                        <span className="text-[9px] font-mono uppercase text-[#e65100] tracking-wider block mb-0.5">
                          {spot.category}
                        </span>
                        <h4 className="font-display text-xs text-[#f4f0e8] line-clamp-1 font-semibold">
                          {spot.name}
                        </h4>
                        <span className="font-mono text-xs font-bold text-white block mt-1">
                          {spot.price.toLocaleString("vi-VN")} ₫
                        </span>
                        <div className="mt-2.5 pt-2 border-t border-white/10 flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleQuickAddHotspot(spot, e)}
                            className="flex-1 min-h-[32px] px-2 bg-[#e65100] hover:bg-[#ff6d00] text-white text-[11px] font-display uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                          >
                            {isAdded ? (
                              <>
                                <Check size={12} />
                                <span>Đã Thêm!</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag size={12} />
                                <span>Mua Nhanh</span>
                              </>
                            )}
                          </button>
                          <Link
                            to="/products"
                            className="min-h-[32px] px-2 border border-white/20 text-[#f4f0e8] text-[11px] font-display uppercase tracking-wider flex items-center justify-center hover:bg-white/5"
                          >
                            Chi Tiết
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Description Column */}
            <div className={`lg:col-span-5 space-y-4 ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
              <span className="text-xs font-mono uppercase text-[#e65100] tracking-widest">
                LOOKBOOK ARCHIVE
              </span>
              <h2 className="font-display text-2xl sm:text-3xl text-[#f4f0e8] uppercase">
                {set.title}
              </h2>
              <h4 className="text-sm font-medium text-[#f4f0e8]/80">
                {set.subtitle}
              </h4>
              <p className="text-xs text-[#9a989f] leading-relaxed">
                {set.desc}
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Link to="/products">
                  <Button variant="signal" size="md">
                    Khám Phá Toàn Bộ Set
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
