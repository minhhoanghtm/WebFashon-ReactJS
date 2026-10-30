import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

import summerImg from "./assets/lookbook-summer.jpg";
import eveningImg from "./assets/lookbook-evening.jpg";
import heroImg from "./assets/hero-atelier.jpg";

const collections = [
  {
    id: "col-1",
    name: "SUMMER ATELIER 2026",
    season: "Spring / Summer 26",
    tagline: "Sự phóng khoáng của chất liệu linen và đường may phi cấu trúc.",
    image: summerImg,
    imagePosition: "object-[center_top]",
    itemCount: "18 Pieces",
    link: "/products?search=linen",
  },
  {
    id: "col-2",
    name: "MIDNIGHT TAILORING",
    season: "Autumn / Winter 26",
    tagline: "Ve áo xẻ sắc sảo kết hợp cùng gam màu trầm tối huyền bí.",
    image: eveningImg,
    imagePosition: "object-[center_top]",
    itemCount: "24 Pieces",
    link: "/products?search=blazer",
  },
  {
    id: "col-3",
    name: "STREETWEAR ARCHITECTURE",
    season: "Permanent Core Run",
    tagline: "Form dáng hộp bất đối xứng và chi tiết túi hộp tiện ích đương đại.",
    image: heroImg,
    imagePosition: "object-[72%_center]",
    itemCount: "16 Pieces",
    link: "/products",
  },
];

export const DraggableCollectionsGallery = () => {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.6;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const scrollBy = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="relative py-20 sm:py-24 bg-[#FBF9F5] overflow-hidden border-b border-[#062D22]/10 select-none">
      <div className="w-full px-2 sm:px-4 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold tracking-[0.25em] text-[#062D22]/60 block mb-2 uppercase">
            CURATED EXHIBITION · 2026
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#062D22] uppercase font-display leading-[0.92] tracking-tight">
            FEATURED COLLECTIONS
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => scrollBy(-450)}
            className="w-11 h-11 rounded-full border border-[#062D22]/20 bg-white hover:bg-[#062D22] hover:text-[#F5DD20] flex items-center justify-center transition-colors text-[#062D22] shadow-xs active:scale-95 cursor-pointer"
            aria-label="Previous Collection"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(450)}
            className="w-11 h-11 rounded-full border border-[#062D22]/20 bg-white hover:bg-[#062D22] hover:text-[#F5DD20] flex items-center justify-center transition-colors text-[#062D22] shadow-xs active:scale-95 cursor-pointer"
            aria-label="Next Collection"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Horizontal Draggable Rail with Custom Cursor trigger */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        data-cursor="drag"
        data-cursor-label="DRAG"
        className="flex gap-8 overflow-x-auto hide-scrollbar px-4 sm:px-6 lg:px-12 cursor-grab active:cursor-grabbing snap-x snap-mandatory scroll-smooth pb-8"
      >
        {collections.map((col, idx) => (
          <div
            key={col.id}
            className="relative shrink-0 w-[82vw] sm:w-[460px] lg:w-[500px] snap-center rounded-3xl overflow-hidden bg-[#EDE6DD] group shadow-[0_16px_50px_rgba(5,37,28,0.06)]"
          >
            {/* Huge Collection Image with Safe Headroom Framing */}
            <div className="relative h-[540px] sm:h-[620px] lg:h-[680px] w-full overflow-hidden">
              <img
                src={col.image}
                alt={col.name}
                draggable="false"
                className={`w-full h-full object-cover ${col.imagePosition || "object-[center_top]"} transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05251C]/90 via-[#05251C]/25 to-black/10" />
            </div>

            {/* Collection Metadata Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-8 sm:p-10 flex flex-col justify-end text-white">
              <div className="flex items-center justify-between mb-3 text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#F5DD20]">
                <span>{col.season}</span>
                <span>{col.itemCount}</span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-black font-display tracking-tight leading-[0.98] text-[#F7F7F7] mb-2">
                {col.name}
              </h3>

              <p className="text-xs sm:text-sm text-[#D1D9CF] max-w-md line-clamp-2 mb-6">
                {col.tagline}
              </p>

              <Link
                to={col.link}
                data-cursor="view"
                data-cursor-label="VIEW"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F5DD20] text-[#05251C] font-display text-xs font-bold uppercase tracking-wider hover:bg-white transition-all duration-300 w-fit active:scale-95 shadow-md"
              >
                <span>Khám phá bộ sưu tập</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DraggableCollectionsGallery;
