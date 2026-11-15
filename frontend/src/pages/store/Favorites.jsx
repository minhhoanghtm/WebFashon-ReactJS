import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ProductCard } from "../../components/shared/ProductCard";
import { productApi } from "../../api/endpoints";

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
          <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block mb-1">
            DANH SÁCH YÊU THÍCH
          </span>
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
      minOrder: 2500000,
      description: "Đặc quyền thành viên VIP: Giảm 250.000 ₫ cho bộ sưu tập Thu Đông",
      expiry: "31/12/2026",
      type: "order",
    },
  ]);
  const [copiedCode, setCopiedCode] = useState("");

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="pb-6 border-b border-[rgba(244,240,232,0.1)] mb-10 text-center space-y-2">
        <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block">
          ĐẶC QUYỀN MUA SẮM
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase text-[#f4f0e8]">
          VOUCHERS & MÃ ƯU ĐÃI ATELIER
        </h1>
        <p className="text-xs text-[#9a989f] max-w-md mx-auto">
          Lưu mã giảm giá vào ví cá nhân và áp dụng tại bước thanh toán để nhận đặc quyền may đo cao cấp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vouchers.map((v) => (
          <div
            key={v._id}
            className="relative bg-[#121215] border border-[rgba(244,240,232,0.15)] p-6 flex flex-col justify-between space-y-4 shadow-lg overflow-hidden group hover:border-[#e65100] transition-colors"
          >
            {/* Cutout notch aesthetic */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#0c0c0e] border border-[rgba(244,240,232,0.15)]" />

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase bg-[#e65100]/20 text-[#ff6d00] border border-[#e65100]/40">
                  {v.type === "shipping" ? "Miễn Phí Vận Chuyển" : "Giảm Giá Đơn Hàng"}
                </span>
                <span className="text-[11px] font-mono text-[#6b6973]">HSD: {v.expiry}</span>
              </div>

              <div className="font-display text-2xl font-bold text-[#f4f0e8]">
                {v.discount.toLocaleString("vi-VN")} ₫
              </div>

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
  const lookbookSets = [
    {
      title: "Chương I: Monochrome Structure",
      subtitle: "Bộ sưu tập may đo đen tuyền và xám khoáng chất",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
      desc: "Nghiên cứu về tỉ lệ vai đệm dứt khoát và đường cắt ve áo tối giản mang cảm hứng kiến trúc Bauhaus.",
    },
    {
      title: "Chương II: Tactile Drapery",
      subtitle: "Nghệ thuật xếp nếp trên nền dạ Cashmere & Lụa Tơ Tằm",
      image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
      desc: "Sự mềm mại tương phản trên kết cấu phom đứng, tạo nên chuyển động thanh lịch theo từng bước chân.",
    },
    {
      title: "Chương III: Urban Resilience",
      subtitle: "Trang phục thường nhật cao cấp với chất liệu chống thấm",
      image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80",
      desc: "Đáp ứng nhịp sống đô thị hiện đại mà không đánh mất đi vẻ tinh xảo của thời trang may đo.",
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-16">
      <div className="text-center space-y-3 pb-8 border-b border-white/10">
        <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block">
          TẠP CHÍ THỜI TRANG & CẢM HỨNG
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold uppercase text-[#f4f0e8]">
          LOOKBOOKS THEO MÙA
        </h1>
        <p className="text-xs text-[#9a989f] max-w-lg mx-auto">
          Bộ ảnh ghi lại quá trình sáng tác và phong cách phối đồ được giám tuyển bởi Giám đốc Sáng tạo Atelier.
        </p>
      </div>

      <div className="space-y-16">
        {lookbookSets.map((set, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
              idx % 2 === 1 ? "lg:flex-row-reverse" : ""
            }`}
          >
            <div className={`lg:col-span-7 aspect-[16/10] overflow-hidden bg-[#161619] border border-white/10 ${idx % 2 === 1 ? "lg:order-2" : ""}`}>
              <img
                src={set.image}
                alt={set.title}
                className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
              />
            </div>
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
              <div className="pt-2">
                <Link to="/products">
                  <Button variant="signal" size="md">
                    Khám Phá Sản Phẩm Trong Set
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
