import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getPageBySlugService } from "@/services/page.service";
import { Sparkles, ArrowUpRight, Calendar, Clock, BookOpen } from "lucide-react";

import HeroSection from "@/components/page-sections/HeroSection";
import StorySection from "@/components/page-sections/StorySection";
import GallerySection from "@/components/page-sections/GallerySection";
import QuoteSection from "@/components/page-sections/QuoteSection";
import ImageTextSection from "@/components/page-sections/ImageTextSection";
import ProductsSection from "@/components/page-sections/ProductsSection";
import BannerSection from "@/components/page-sections/BannerSection";
import CTASection from "@/components/page-sections/CTASection";

import summerImg from "../Home/assets/lookbook-summer.jpg";
import eveningImg from "../Home/assets/lookbook-evening.jpg";
import blazerImg from "../Home/assets/product-navy-blazer.jpg";

const articles = [
  {
    id: "art-1",
    title: "CẤU TRÚC PHI ĐỐI XỨNG: BƯỚC ĐỘT PHÁ CỦA THỜI TRANG ĐƯƠNG ĐẠI",
    category: "EDITORIAL / ARCHITECTURE",
    date: "28.10.2026",
    readTime: "5 min read",
    image: eveningImg,
    excerpt: "Làm thế nào các nhà thiết kế tại xưởng may 404Studio tái định nghĩa ve áo blazer truyền thống thành một tác phẩm nghệ thuật vị lai.",
  },
  {
    id: "art-2",
    title: "HÀNH TRÌNH TỪ SỢI LANH PHÁP ĐẾN CHIẾC ÁO OVERSHIRT MÙA HÈ",
    category: "CRAFT & MATERIAL",
    date: "15.10.2026",
    readTime: "4 min read",
    image: summerImg,
    excerpt: "Khám phá quy trình dệt thoi hữu cơ tạo nên bề mặt sợi thô mộc, thoáng khí và có khả năng chống tia UV tự nhiên vượt trội.",
  },
  {
    id: "art-3",
    title: "PHONG CÁCH TONE-ON-TONE: NGHỆ THUẬT PHỐI GAM MÀU TRẦM TỐI",
    category: "STYLING GUIDE",
    date: "02.10.2026",
    readTime: "6 min read",
    image: blazerImg,
    excerpt: "Bí quyết kết hợp các sắc độ đen, xanh rừng sâu và than chì để tạo chiều sâu thị giác ấn tượng trong trang phục thường nhật.",
  },
];

export const Blog = () => {
  useDocumentTitle("Tạp chí thời trang — 404STUDIO");
  const [contentHtml, setContentHtml] = useState("");
  const [pageSections, setPageSections] = useState([]);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const data = await getPageBySlugService("blog").catch(() => null);
        const page = data?.page || data;
        const sections = data?.sections || data?.page?.sections || [];
        if (page?.content) setContentHtml(page.content);
        if (sections && sections.length > 0) setPageSections(sections);
      } catch (err) {
        console.error("Lỗi khi tải thông tin blog:", err);
      }
    };
    fetchBlog();
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#05251C] py-12 sm:py-20 select-none">
      <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#05251C]/5 border border-[#05251C]/10 text-[10px] font-black tracking-[0.25em] text-[#05251C] uppercase mb-4">
            <Sparkles size={12} className="text-[#05251C]" />
            <span>THE JOURNAL & EDITORIAL STORIES</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#05251C] uppercase font-display leading-[0.92] tracking-tighter">
            TẠP CHÍ ATELIER.
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-[#6B716E] max-w-lg mx-auto leading-relaxed">
            Nơi ghi lại những câu chuyện sáng tạo, kỹ thuật may đo và góc nhìn văn hóa thời trang đương đại.
          </p>
        </div>

        {/* Dynamic CMS Sections if populated */}
        {pageSections && pageSections.length > 0 && (
          <div className="w-full mb-16">
            {[...pageSections]
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((section) => {
                switch (section.type) {
                  case "hero": return <HeroSection key={section._id || section.order} data={section.data} />;
                  case "story": return <StorySection key={section._id || section.order} data={section.data} />;
                  case "gallery": return <GallerySection key={section._id || section.order} data={section.data} />;
                  case "quote": return <QuoteSection key={section._id || section.order} data={section.data} />;
                  case "image_text": return <ImageTextSection key={section._id || section.order} data={section.data} />;
                  case "products": return <ProductsSection key={section._id || section.order} data={section.data} />;
                  case "banner": return <BannerSection key={section._id || section.order} data={section.data} />;
                  case "cta": return <CTASection key={section._id || section.order} data={section.data} />;
                  default: return null;
                }
              })}
          </div>
        )}

        {/* Featured Top Article */}
        <div className="mb-14 rounded-3xl overflow-hidden bg-white border border-[#05251C]/10 shadow-xs grid grid-cols-1 lg:grid-cols-12 group">
          <div className="lg:col-span-7 h-[360px] sm:h-[480px] overflow-hidden bg-[#EDE6DD]">
            <img
              src={articles[0].image}
              alt={articles[0].title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 text-[11px] font-bold text-[#6B716E] uppercase tracking-widest mb-4">
                <span className="text-[#05251C] bg-[#F5DD20] px-2.5 py-0.5 rounded-full">{articles[0].category}</span>
                <span className="flex items-center gap-1"><Calendar size={13} /> {articles[0].date}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-[#05251C] uppercase leading-tight tracking-tight mb-4">
                {articles[0].title}
              </h2>
              <p className="text-xs sm:text-sm text-[#6B716E] leading-relaxed">
                {articles[0].excerpt}
              </p>
            </div>

            <div className="pt-8 flex items-center justify-between border-t border-[#05251C]/10">
              <span className="text-xs font-bold text-[#6B716E] flex items-center gap-1">
                <Clock size={14} /> {articles[0].readTime}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#05251C] hover:text-[#073D2A] group/btn"
              >
                <span>Đọc bài viết</span>
                <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.slice(1).map((art) => (
            <div
              key={art.id}
              className="bg-white rounded-3xl border border-[#05251C]/10 overflow-hidden shadow-xs hover:border-[#05251C]/30 transition-colors group flex flex-col justify-between"
            >
              <div className="h-64 overflow-hidden bg-[#EDE6DD]">
                <img
                  src={art.image}
                  alt={art.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-[#6B716E] uppercase tracking-widest mb-3">
                    <span className="text-[#05251C] font-extrabold">{art.category}</span>
                    <span>·</span>
                    <span>{art.date}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black font-display text-[#05251C] uppercase leading-snug tracking-tight mb-3">
                    {art.title}
                  </h3>
                  <p className="text-xs text-[#6B716E] leading-relaxed line-clamp-2">
                    {art.excerpt}
                  </p>
                </div>

                <div className="pt-6 mt-6 flex items-center justify-between border-t border-[#05251C]/10">
                  <span className="text-[11px] font-bold text-[#6B716E] flex items-center gap-1">
                    <Clock size={13} /> {art.readTime}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#05251C]">
                    <span>Xem tiếp</span>
                    <ArrowUpRight size={13} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
