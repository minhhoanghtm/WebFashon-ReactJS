import React, { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getPageBySlugService } from "@/services/page.service";
import { Loader2, AlertCircle } from "lucide-react";
import AboutHero from "../About/AboutHero";

// Dynamic Section Components
import HeroSection from "@/components/page-sections/HeroSection";
import StorySection from "@/components/page-sections/StorySection";
import GallerySection from "@/components/page-sections/GallerySection";
import QuoteSection from "@/components/page-sections/QuoteSection";
import ImageTextSection from "@/components/page-sections/ImageTextSection";
import ProductsSection from "@/components/page-sections/ProductsSection";
import BannerSection from "@/components/page-sections/BannerSection";
import CTASection from "@/components/page-sections/CTASection";

import "../About/about.css";

const Landing = () => {
  useDocumentTitle("Xu hướng thời trang mới");
  const [contentHtml, setContentHtml] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [pageExcerpt, setPageExcerpt] = useState("");
  const [pageSections, setPageSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLanding = async () => {
      try {
        setLoading(true);
        const data = await getPageBySlugService("landing").catch(() => null);
        
        const page = data?.page || data;
        const sections = data?.sections || data?.page?.sections || [];

        if (page) {
          if (page.title) setPageTitle(page.title);
          if (page.excerpt) setPageExcerpt(page.excerpt);
          if (page.content) setContentHtml(page.content);
        }
        if (sections && sections.length > 0) {
          setPageSections(sections);
        }
      } catch (err) {
        console.error("Lỗi khi tải trang Landing:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLanding();
  }, []);

  if (loading) {
    return (
      <div className="about-loading-container">
        <Loader2 className="about-loading-spinner animate-spin" />
        <span>Đang tải thông tin landing...</span>
      </div>
    );
  }

  const hasSections = pageSections && pageSections.length > 0;
  const hasContent = contentHtml && contentHtml.trim() !== "";

  return (
    <div className="about-page">
      <div className="about-page__container">
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
          <>
            <AboutHero title={pageTitle} description={pageExcerpt} />
            <main className="about-page__content">
              <section 
                className="about-page__custom-content ql-editor"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            </main>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900/20 max-w-4xl mx-auto mt-8">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white mt-2">Trang landing chưa cấu hình</h3>
            <p className="max-w-sm text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mx-auto">
              Nội dung của trang landing hiện chưa được thiết lập trên hệ thống quản trị. Vui lòng truy cập trang Quản lý trang để thiết lập nội dung.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
