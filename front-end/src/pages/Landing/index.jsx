import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getPageBySlugService } from "@/services/page.service";
import { Sparkles, ArrowUpRight, Compass, ShieldCheck } from "lucide-react";

import HeroSection from "@/components/page-sections/HeroSection";
import StorySection from "@/components/page-sections/StorySection";
import GallerySection from "@/components/page-sections/GallerySection";
import QuoteSection from "@/components/page-sections/QuoteSection";
import ImageTextSection from "@/components/page-sections/ImageTextSection";
import ProductsSection from "@/components/page-sections/ProductsSection";
import BannerSection from "@/components/page-sections/BannerSection";
import CTASection from "@/components/page-sections/CTASection";

import heroImg from "../Home/assets/hero-atelier.jpg";
import summerImg from "../Home/assets/lookbook-summer.jpg";
import eveningImg from "../Home/assets/lookbook-evening.jpg";

export const Landing = () => {
  useDocumentTitle("Không gian trải nghiệm — 404STUDIO");
  const [contentHtml, setContentHtml] = useState("");
  const [pageSections, setPageSections] = useState([]);

  useEffect(() => {
    const fetchLanding = async () => {
      try {
        const data = await getPageBySlugService("landing").catch(() => null);
        const page = data?.page || data;
        const sections = data?.sections || data?.page?.sections || [];
        if (page?.content) setContentHtml(page.content);
        if (sections && sections.length > 0) setPageSections(sections);
      } catch (err) {
        console.error("Lỗi khi tải trang Landing:", err);
      }
    };
    fetchLanding();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#05251C] select-none">
      {/* Dynamic CMS Sections if populated */}
      {pageSections && pageSections.length > 0 ? (
        <div className="w-full">
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
      ) : (
        /* Immersive Fashion Brand Landing */
        <div className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#05251C] text-[#F5DD20] text-[10px] font-black tracking-[0.25em] uppercase mb-4 shadow-sm">
              <Sparkles size={12} />
              <span>DIGITAL SHOWCASE · ATELIER 2026</span>
            </div>

            <h1 className="text-4xl sm:text-7xl font-black text-[#05251C] uppercase font-display leading-[0.9] tracking-tighter">
              WHERE STRUCTURE<br />
              MEETS FLUIDITY.
            </h1>

            <p className="mt-6 text-sm sm:text-base text-[#6B716E] max-w-xl mx-auto leading-relaxed font-medium">
              Khám phá không gian trải nghiệm thời trang may đo đương đại. Nơi từng đường viền và cấu trúc vải hòa quyện thành bản sắc của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="rounded-3xl overflow-hidden shadow-lg bg-[#EDE6DD] aspect-4/5 relative group">
              <img src={heroImg} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8 text-white">
                <span className="text-[10px] font-bold text-[#F5DD20] uppercase tracking-widest">CHAPTER 01</span>
                <h3 className="font-display font-black text-xl uppercase mt-1">TAILORED CUTS</h3>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-lg bg-[#EDE6DD] aspect-4/5 relative group md:-translate-y-6">
              <img src={summerImg} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8 text-white">
                <span className="text-[10px] font-bold text-[#F5DD20] uppercase tracking-widest">CHAPTER 02</span>
                <h3 className="font-display font-black text-xl uppercase mt-1">ORGANIC LINEN</h3>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-lg bg-[#EDE6DD] aspect-4/5 relative group">
              <img src={eveningImg} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8 text-white">
                <span className="text-[10px] font-bold text-[#F5DD20] uppercase tracking-widest">CHAPTER 03</span>
                <h3 className="font-display font-black text-xl uppercase mt-1">MIDNIGHT SHADES</h3>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#05251C] text-[#F7F7F7] font-display text-xs font-bold uppercase tracking-wider hover:bg-[#F5DD20] hover:text-[#05251C] transition-all duration-300 shadow-xl active:scale-95"
            >
              <span>Trải nghiệm toàn bộ bộ sưu tập</span>
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
