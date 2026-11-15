import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { SafeImage } from "../ui/SafeImage";

export function CategoryMosaic({ categories = [] }) {
  // Editorial curated tiles mapping
  const editorialTiles = [
    {
      id: "outerwear",
      title: "Áo Khoác Atelier",
      subtitle: "Blazer len Ý & Măng tô may đo chuẩn phom",
      count: "18 Thiết kế",
      image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=1000&q=80",
      link: "/products?search=Áo%20khoác",
      colSpan: "lg:col-span-8 lg:row-span-2",
      aspect: "aspect-[4/3] lg:aspect-[16/10]",
    },
    {
      id: "trousers",
      title: "Quần Tây May Đo",
      subtitle: "Xếp ly đôi & Ống suông cấu trúc",
      count: "12 Thiết kế",
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80",
      link: "/products?search=Quần",
      colSpan: "lg:col-span-4",
      aspect: "aspect-[4/3]",
    },
    {
      id: "shirts",
      title: "Sơ Mi Cấu Trúc",
      subtitle: "Cotton Ai Cập & Cổ áo tối giản",
      count: "15 Thiết kế",
      image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80",
      link: "/products?search=Sơ%20mi",
      colSpan: "lg:col-span-4",
      aspect: "aspect-[4/3]",
    },
    {
      id: "leather",
      title: "Phụ Kiện Thủ Công",
      subtitle: "Da bò thuộc thảo mộc Toscana",
      count: "09 Thiết kế",
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
      link: "/products?search=Túi",
      colSpan: "lg:col-span-6",
      aspect: "aspect-[16/9] lg:aspect-[2/1]",
    },
    {
      id: "footwear",
      title: "Giày & Boots Cao Cấp",
      subtitle: "Kỹ thuật may đế Goodyear Welted",
      count: "08 Thiết kế",
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
      link: "/products?search=Giày",
      colSpan: "lg:col-span-6",
      aspect: "aspect-[16/9] lg:aspect-[2/1]",
    },
  ];

  return (
    <section className="py-16 sm:py-24 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full border-b border-[rgba(244,240,232,0.1)]">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-[rgba(244,240,232,0.1)]">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block mb-1">
            DANH MỤC THIẾT KẾ ĐẶC QUYỀN
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f0e8]">
            SHOP BY CATEGORY MOSAIC
          </h2>
        </div>
        <p className="text-xs text-[#9a989f] max-w-sm">
          Tuyển tập các dòng trang phục chủ lực được may đo từ các loại vải thượng hạng đạt chứng chỉ bền vững.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {editorialTiles.map((tile) => (
          <Link
            key={tile.id}
            to={tile.link}
            className={`group relative overflow-hidden bg-[#161619] border border-[rgba(244,240,232,0.1)] hover:border-[#e65100]/60 transition-all duration-500 ${tile.colSpan}`}
          >
            {/* Background Image with Zoom */}
            <div className={`w-full ${tile.aspect} overflow-hidden relative`}>
              <SafeImage
                src={tile.image}
                alt={tile.title}
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/40 to-transparent opacity-85 group-hover:opacity-75 transition-opacity" />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest text-[#e65100] uppercase bg-[#0c0c0e]/80 px-2.5 py-1 border border-white/10">
                  {tile.count}
                </span>
                <div className="w-8 h-8 rounded-full bg-[#161619]/80 border border-white/15 flex items-center justify-center text-[#f4f0e8] group-hover:bg-[#e65100] group-hover:border-[#e65100] transition-colors">
                  <ArrowUpRight size={14} />
                </div>
              </div>

              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold uppercase text-[#f4f0e8] group-hover:text-[#ff6d00] transition-colors mb-1">
                  {tile.title}
                </h3>
                <p className="text-xs text-[#9a989f] line-clamp-1">
                  {tile.subtitle}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
