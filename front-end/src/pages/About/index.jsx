import React, { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getPageBySlugService } from "@/services/page.service";
import { Loader2, Sparkles, Feather, Scissors, Globe } from "lucide-react";
import AboutEditorialHero from "./AboutEditorialHero";

// Dynamic Section Components
import HeroSection from "@/components/page-sections/HeroSection";
import StorySection from "@/components/page-sections/StorySection";
import GallerySection from "@/components/page-sections/GallerySection";
import QuoteSection from "@/components/page-sections/QuoteSection";
import ImageTextSection from "@/components/page-sections/ImageTextSection";
import ProductsSection from "@/components/page-sections/ProductsSection";
import BannerSection from "@/components/page-sections/BannerSection";
import CTASection from "@/components/page-sections/CTASection";

import "./about.css";

const corePillars = [
  {
    icon: Scissors,
    title: "CẤU TRÚC MAY ĐO ĐỘC BẢN",
    desc: "Mỗi đường cắt may được nghiên cứu kỹ lưỡng để tạo nên phom dáng sắc nét, giữ phom hoàn hảo nhưng vẫn êm ái khi cử động.",
    number: "01",
  },
  {
    icon: Feather,
    title: "VẬT LIỆU TỰ NHIÊN HỮU CƠ",
    desc: "Chúng tôi ưu tiên French Flax Linen, Cotton hữu cơ chải kỹ và len lông cừu nguyên bản – mang lại sự dễ chịu tối đa cho làn da.",
    number: "02",
  },
  {
    icon: Globe,
    title: "BỀN VỮNG & CÓ TRÁCH NHIỆM",
    desc: "Sản xuất theo từng mẻ nhỏ (limited batches), giảm thiểu tối đa tồn kho dư thừa và tôn trọng giá trị của từng người thợ thủ công.",
    number: "03",
  },
];

const About = () => {
  useDocumentTitle("Câu chuyện thương hiệu — 404STUDIO");
  const [aboutUsHtml, setAboutUsHtml] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [pageExcerpt, setPageExcerpt] = useState("");
  const [pageSections, setPageSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAboutUs = async () => {
      try {
        setLoading(true);
        const data = await getPageBySlugService("about-us").catch(() => 
          getPageBySlugService("about").catch(() => null)
        );
        
        const page = data?.page || data;
        const sections = data?.sections || data?.page?.sections || [];

        if (page) {
          if (page.title) setPageTitle(page.title);
          if (page.excerpt) setPageExcerpt(page.excerpt);
          if (page.content) setAboutUsHtml(page.content);
        }
        
        if (sections && sections.length > 0) {
          setPageSections(sections);
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin giới thiệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAboutUs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#073D2A] flex flex-col items-center justify-center text-[#F1D8CA] gap-3">
        <Loader2 className="animate-spin text-[#F5DD20]" size={36} />
        <span className="text-xs uppercase font-extrabold tracking-widest text-[#D1D9CF]">Đang khởi tạo không gian Atelier...</span>
      </div>
    );
  }

  const hasSections = pageSections && pageSections.length > 0;
  const hasContent = aboutUsHtml && aboutUsHtml.trim() !== "";

  return (
    <div className="about-page bg-[#073D2A] text-[#F1D8CA] min-h-screen selection:bg-[#F5DD20] selection:text-[#05251C]">
      {/* 1. Immersive 2D Editorial Brand Hero */}
      <AboutEditorialHero />

      {/* 2. Brand Core Pillars & Craftsmanship Section */}
      <section className="py-24 sm:py-32 border-t border-[#F1D8CA]/15 bg-[#05291C]/70 relative z-10">
        <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
          <div className="mb-16 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#073D2A] border border-[#F1D8CA]/20 text-[10px] font-extrabold tracking-[0.25em] text-[#F5DD20] uppercase mb-4">
              <Sparkles size={12} />
              <span>THE CRAFT & VALUES</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black font-display text-[#F1D8CA] uppercase tracking-tight leading-[0.95]">
              GIÁ TRỊ TẠO NÊN SỰ KHÁC BIỆT.
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-[#D1D9CF] leading-relaxed">
              Từ xưởng may tại Việt Nam đến sàn diễn thời trang số, 404Studio duy trì tiêu chuẩn khắt khe nhất trong từng chi tiết hoàn thiện.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {corePillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.number}
                  className="bg-[#073D2A]/80 border border-[#F1D8CA]/15 rounded-3xl p-8 hover:border-[#F5DD20] transition-colors duration-300 relative group"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#05251C] border border-[#F1D8CA]/20 flex items-center justify-center text-[#F5DD20] group-hover:scale-110 transition-transform">
                      <Icon size={20} />
                    </div>
                    <span className="font-display font-black text-2xl text-[#F1D8CA]/25 group-hover:text-[#F5DD20]/50 transition-colors">
                      {p.number}
                    </span>
                  </div>

                  <h3 className="font-display font-black text-lg text-[#F1D8CA] uppercase tracking-tight mb-3">
                    {p.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#D1D9CF] leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. CMS Sections or Rich Editorial Story Content */}
      {hasSections ? (
        <div className="w-full">
          {[...pageSections]
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((section) => {
              switch (section.type) {
                case "hero":
                  return <HeroSection key={section._id || section.order} data={section.data} />;
                case "story":
                  return <StorySection key={section._id || section.order} data={section.data} />;
                case "gallery":
                  return <GallerySection key={section._id || section.order} data={section.data} />;
                case "quote":
                  return <QuoteSection key={section._id || section.order} data={section.data} />;
                case "image_text":
                  return <ImageTextSection key={section._id || section.order} data={section.data} />;
                case "products":
                  return <ProductsSection key={section._id || section.order} data={section.data} />;
                case "banner":
                  return <BannerSection key={section._id || section.order} data={section.data} />;
                case "cta":
                  return <CTASection key={section._id || section.order} data={section.data} />;
                default:
                  return null;
              }
            })}
        </div>
      ) : hasContent ? (
        <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
          <div 
            className="about-page__custom-content ql-editor text-[#F1D8CA]"
            dangerouslySetInnerHTML={{ __html: aboutUsHtml }}
          />
        </section>
      ) : null}
    </div>
  );
};

export default About;
