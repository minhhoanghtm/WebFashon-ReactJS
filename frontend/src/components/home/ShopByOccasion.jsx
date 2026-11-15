import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Briefcase, Coffee, Wine, Sun } from "lucide-react";
import { SafeImage } from "../ui/SafeImage";

export function ShopByOccasion() {
  const occasions = [
    {
      id: "workplace",
      title: "Công Sở Đương Đại",
      subtitle: "Phom dáng sắc sảo, tối giản và tự tin trong mọi cuộc họp quan trọng.",
      icon: Briefcase,
      image: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800&q=80",
      query: "Áo",
      tag: "WORKWEAR",
    },
    {
      id: "weekend",
      title: "Dạo Phố Cuối Tuần",
      subtitle: "Sự thoải mái phóng khoáng cùng những phom dáng relaxed đương đại.",
      icon: Coffee,
      image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&q=80",
      query: "Hoodie",
      tag: "CASUAL",
    },
    {
      id: "gala",
      title: "Dạ Tiệc & Sự Kiện",
      subtitle: "Tuyên ngôn đẳng cấp với sắc đen lụa và những đường may Haute Couture.",
      icon: Wine,
      image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80",
      query: "Blazer",
      tag: "BLACK TIE",
    },
    {
      id: "resort",
      title: "Nghỉ Dưỡng Thư Thái",
      subtitle: "Chất liệu linen dệt mộc tự nhiên mang lại cảm giác nhẹ nhàng, thông thoáng.",
      icon: Sun,
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80",
      query: "Sơ mi",
      tag: "RESORT",
    },
  ];

  return (
    <section className="py-16 sm:py-24 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full border-b border-[rgba(244,240,232,0.1)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-[rgba(244,240,232,0.1)]">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block mb-1">
            NGỮ CẢNH PHỤC TRANG
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f0e8]">
            SHOP BY OCCASION
          </h2>
        </div>
        <p className="text-xs text-[#9a989f] max-w-sm">
          Khám phá các gợi ý trang phục được tuyển chọn kỹ lưỡng theo từng dịp sự kiện trong cuộc sống của bạn.
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {occasions.map((occ) => {
          const Icon = occ.icon;
          return (
            <Link
              key={occ.id}
              to={`/products?search=${encodeURIComponent(occ.query)}`}
              className="group relative bg-[#161619] border border-[rgba(244,240,232,0.1)] hover:border-[#e65100]/60 overflow-hidden transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image Preview */}
              <div className="aspect-[4/3] w-full overflow-hidden relative">
                <SafeImage
                  src={occ.image}
                  alt={occ.title}
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161619] via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-2 py-0.5 bg-[#0c0c0e]/85 border border-white/10 text-[9px] font-mono uppercase tracking-widest text-[#ff6d00]">
                  {occ.tag}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="w-7 h-7 rounded bg-[#202025] flex items-center justify-center text-[#e65100] mb-2">
                    <Icon size={14} />
                  </div>
                  <h3 className="font-display text-base font-bold text-[#f4f0e8] group-hover:text-[#ff6d00] transition-colors">
                    {occ.title}
                  </h3>
                  <p className="text-xs text-[#9a989f] leading-relaxed line-clamp-2">
                    {occ.subtitle}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/5 text-xs font-display uppercase tracking-wider text-[#9a989f] group-hover:text-[#f4f0e8] transition-colors">
                  <span>Khám phá các mẫu</span>
                  <ArrowUpRight size={13} className="text-[#e65100]" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
