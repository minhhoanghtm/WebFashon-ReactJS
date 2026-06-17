import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getLookbookBySlugService, incrementPageViewService } from "../../services/page.service";
import { Loader2, Calendar, Eye, ArrowLeft, ArrowRight } from "lucide-react";

// Dynamic Section Components
import HeroSection from "../../components/page-sections/HeroSection";
import StorySection from "../../components/page-sections/StorySection";
import GallerySection from "../../components/page-sections/GallerySection";
import QuoteSection from "../../components/page-sections/QuoteSection";
import ImageTextSection from "../../components/page-sections/ImageTextSection";
import ProductsSection from "../../components/page-sections/ProductsSection";
import BannerSection from "../../components/page-sections/BannerSection";
import CTASection from "../../components/page-sections/CTASection";

const LookbookDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync scroll to top on slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  // Fetch Lookbook Details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getLookbookBySlugService(slug);
        setData(res);
      } catch (err) {
        console.error("Lỗi khi tải chi tiết lookbook:", err);
        setError(err.response?.data?.message || "Không thể tải chi tiết bộ sưu tập");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchDetails();
      // Record view count separately
      incrementPageViewService(slug);
    }
  }, [slug]);

  // Inject SEO metadata dynamically
  useEffect(() => {
    if (data?.page) {
      const page = data.page;
      document.title = (page.seoTitle || page.title) + " - WebFashion";

      // Meta Description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = page.seoDescription || page.excerpt || "";

      // Meta Keywords
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement("meta");
        metaKeywords.name = "keywords";
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.content = page.seoKeywords || "";
    }

    return () => {
      document.title = "WebFashion - Thời trang cao cấp";
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-neutral-50">
        <Loader2 className="h-10 w-10 animate-spin text-neutral-900" />
        <span className="ml-3 text-sm font-semibold text-neutral-600">Đang tải bộ sưu tập...</span>
      </div>
    );
  }

  if (error || !data?.page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center p-8 bg-neutral-50">
        <div className="max-w-md bg-white p-8 rounded-none border border-neutral-200">
          <h2 className="text-red-500 font-bold text-lg mb-2">Đã xảy ra lỗi</h2>
          <p className="text-neutral-500 text-xs mb-6">{error || "Bộ sưu tập này không khả dụng hoặc đã bị gỡ bỏ."}</p>
          <button
            onClick={() => navigate("/lookbooks")}
            className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-none transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại Lookbooks
          </button>
        </div>
      </div>
    );
  }

  const { page, relatedLookbooks = [] } = data;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 text-left rounded-none">
      
      {/* 1. Dynamic Component Builder Renders */}
      <div className="w-full">
        {page.sections && page.sections.length > 0 ? (
          [...page.sections]
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
            })
        ) : (
          /* Fallback Typographic layout if no blocks exist */
          <div className="max-w-4xl mx-auto px-6 py-32 text-center rounded-none select-none">
            <h2 
              className="text-neutral-900 text-3xl md:text-5xl font-semibold tracking-wide uppercase mb-6"
            >
              {page.title ? page.title.normalize("NFC") : ""}
            </h2>
            {page.excerpt && (
              <p className="text-neutral-500 text-xs md:text-sm max-w-xl mx-auto font-light leading-relaxed tracking-wider uppercase font-sans">
                {page.excerpt.normalize("NFC")}
              </p>
            )}
            <div className="w-16 h-[1px] bg-neutral-200 mx-auto mt-8" />
          </div>
        )}
      </div>

      {/* 2. Dark Editorial Related Lookbooks & Footer navigation */}
      <div className="bg-[#050505] text-white py-24 border-t border-neutral-950 rounded-none">
        
        {relatedLookbooks.length > 0 && (
          <div className="max-w-5xl mx-auto px-6 md:px-12 rounded-none mb-16">
            <div className="flex flex-col items-center justify-center text-center gap-2 mb-16 rounded-none select-none">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Discover More</span>
              <h2 
                className="text-2xl md:text-3xl font-semibold text-white tracking-wide uppercase"
              >
                Khám phá thêm bộ sưu tập
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 rounded-none">
              {relatedLookbooks.map((lb) => {
                const coverImage = lb.thumbnailUrl || lb.bannerUrl;

                return (
                  <Link 
                    key={lb._id} 
                    to={`/lookbooks/${lb.slug}`}
                    className="group flex flex-col bg-[#0d0f12] border border-neutral-900/60 overflow-hidden shadow-none rounded-[12px] hover:scale-[1.01] transition-all duration-300"
                  >
                    {coverImage && (
                      <div className="aspect-[16/9.5] w-full overflow-hidden bg-neutral-950 rounded-t-[12px]">
                        <img
                          src={coverImage}
                          alt={lb.title}
                          className="w-full h-full object-cover object-center group-hover:scale-[1.025] transition-transform duration-750 rounded-t-[12px]"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col text-left">
                      <span className="text-neutral-500 text-[9px] font-semibold uppercase tracking-[0.15em] mb-2 block">
                        {formatDate(lb.publishedAt || lb.createdAt)}
                      </span>
                      <h3 
                        className="text-white text-base font-semibold leading-snug group-hover:text-neutral-300 transition mb-2 uppercase tracking-wide"
                      >
                        {lb.title ? lb.title.normalize("NFC") : ""}
                      </h3>
                      {lb.excerpt && (
                        <p className="text-neutral-400 text-xs font-light leading-relaxed mb-4 line-clamp-2">
                          {lb.excerpt.normalize("NFC")}
                        </p>
                      )}
                      <div className="mt-auto pt-2 text-[9px] font-bold uppercase tracking-widest text-neutral-400 group-hover:text-white transition">
                        XEM BỘ SƯU TẬP →
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Back to List button */}
        <div className="text-center px-6 rounded-none select-none pt-4">
          <Link
            to="/lookbooks"
            className="inline-flex items-center justify-center px-8 py-3 border border-neutral-700 bg-transparent text-white text-[10px] font-bold uppercase tracking-widest hover:border-white transition duration-300 rounded-none cursor-pointer"
          >
            &lt; QUAY LẠI DANH SÁCH LOOKBOOKS
          </Link>
        </div>

      </div>

    </div>
  );
};

export default LookbookDetail;
