import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { getLookbooksService } from "@/services/page.service";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const BrandChapterSection = () => {
  const containerRef = useRef(null);
  const colLeftRef = useRef(null);
  const col1Ref = useRef(null);
  const col2Ref = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const { settings } = useWebsiteSettings();
  const brandChapter = settings?.homeContent?.brandChapter || {
    eyebrow: "CHƯƠNG 01 · TRIẾT LÝ THIẾT KẾ",
    headingLines: ["NGHỆ THUẬT", "MAY ĐO", "KIẾN TRÚC."],
    description:
      "Mỗi đường cắt là một tuyên ngôn về sự chuẩn xác. Chúng tôi từ chối những chi tiết rườm rà để giải phóng cấu trúc nguyên bản — nơi chất liệu tự nhiên và đường may đơn sắc tôn vinh tỷ lệ hình thể đương đại.",
    cta: "XEM TẤT CẢ THIẾT KẾ",
  };

  const [lookbookImages, setLookbookImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real lookbook images from API
  useEffect(() => {
    let isMounted = true;
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        const res = await getLookbooksService({ limit: 4 });
        const list = res.pages || res.data || [];
        if (!isMounted || !Array.isArray(list) || list.length === 0) {
          setIsLoading(false);
          return;
        }

        const imgs = list
          .map((item, idx) => ({
            id: item._id || item.id || `lb-${idx}`,
            title: item.title || `ẤN BẢN ATELIER 0${idx + 1}`,
            subtitle: item.excerpt || "Kỹ nghệ may đo chuẩn mực",
            imageUrl: item.thumbnailUrl || item.cover || item.thumbnail || item.image || item.bannerUrl || "",
            code: `ED-0${idx + 1}`,
          }))
          .filter((item) => Boolean(item.imageUrl));

        if (imgs.length > 0) {
          setLookbookImages(imgs);
        }
      } catch {
        // Handled silently
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchImages();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayItems = lookbookImages;

  // GSAP Animations: Clip-path reveal + Multi-speed Column Parallax
  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current || displayItems.length === 0) return undefined;

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768;

      // 1. Text slide-up mask reveal
      const headingLines = colLeftRef.current?.querySelectorAll(".brand-heading-line");
      if (headingLines && headingLines.length > 0) {
        gsap.fromTo(
          headingLines,
          { y: "115%", opacity: 0 },
          {
            y: "0%",
            opacity: 1,
            stagger: 0.12,
            duration: 1.0,
            ease: "power3.out",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // 2. Image Reveal via clip-path
      const imageCards = containerRef.current?.querySelectorAll(".clip-reveal-card");
      imageCards?.forEach((card) => {
        const innerImg = card.querySelector(".clip-reveal-img");
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });

        tl.fromTo(
          card,
          { clipPath: "inset(100% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.1,
            ease: "power3.inOut",
          }
        );

        if (innerImg) {
          tl.fromTo(
            innerImg,
            { scale: 1.18 },
            { scale: 1.0, duration: 1.3, ease: "power2.out" },
            0
          );
        }
      });

      // 3. Staggered Column Parallax on desktop only
      if (!isMobile) {
        if (col1Ref.current) {
          gsap.to(col1Ref.current, {
            y: -50,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          });
        }

        if (col2Ref.current) {
          gsap.to(col2Ref.current, {
            y: 70,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.6,
            },
          });
        }
      }
    }, containerRef);

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 300);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
    };
  }, [prefersReducedMotion, displayItems]);

  const itemsCol1 = [displayItems[0], displayItems[2]].filter(Boolean);
  const itemsCol2 = [displayItems[1], displayItems[3]].filter(Boolean);

  return (
    <section
      ref={containerRef}
      aria-label="Chương thương hiệu: Triết lý cấu trúc may đo"
      className="relative z-10 bg-white text-[#05251C] px-4 py-20 sm:px-8 sm:py-32 lg:px-14 lg:py-40 border-t border-[#05251C]/10"
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16 items-start">
          {/* Left Column: Brand Manifesto Narrative */}
          <div
            ref={colLeftRef}
            className="lg:col-span-5 lg:sticky lg:top-28 space-y-8"
          >
            <div className="space-y-1">
              <span className="font-mono text-xs tracking-[0.28em] text-[#05251C]/60 uppercase">
                {brandChapter.eyebrow}
              </span>
              <div className="h-[1px] w-16 bg-[#05251C]/20" />
            </div>

            <div className="overflow-hidden">
              <h2 className="font-condensed text-5xl font-bold uppercase tracking-tight text-[#05251C] sm:text-6xl lg:text-7xl leading-[1.18] sm:leading-[1.2] py-[0.12em]">
                {Array.isArray(brandChapter.headingLines) &&
                  brandChapter.headingLines.map((line, idx) => (
                    <span
                      key={line}
                      className={`brand-heading-line block ${
                        idx === brandChapter.headingLines.length - 1
                          ? "text-[#05251C]/50"
                          : ""
                      }`}
                    >
                      {line}
                    </span>
                  ))}
              </h2>
            </div>

            <p className="max-w-md font-sans text-sm font-normal leading-relaxed text-[#05251C]/75 sm:text-base">
              {brandChapter.description}
            </p>

            <div className="pt-2">
              <Link
                to="/products"
                className="group inline-flex min-h-[44px] items-center gap-3 border border-[#05251C]/30 px-6 py-3 text-xs font-semibold tracking-[0.24em] text-[#05251C] uppercase transition-all duration-300 hover:border-[#05251C] hover:bg-[#05251C] hover:text-white"
              >
                <span>{brandChapter.cta}</span>
                <ArrowUpRight
                  size={15}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>
          </div>

          {/* Right Column: Staggered Lookbook Columns */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            {displayItems.length === 0 && !isLoading && (
              <div className="sm:col-span-2 py-16 text-center border border-dashed border-[#05251C]/20 rounded-md">
                <p className="text-xs text-[#05251C]/50 font-mono tracking-widest uppercase">
                  Hiện chưa có ấn bản lookbook được công bố
                </p>
              </div>
            )}

            {/* Column 1 */}
            <div ref={col1Ref} className="space-y-8 sm:space-y-12">
              {itemsCol1.map((item) => (
                <div key={item.id} className="group space-y-3">
                  <div className="clip-reveal-card relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 border border-[#05251C]/10 shadow-xs">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="clip-reveal-img h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                      onLoad={() => ScrollTrigger.refresh()}
                    />
                  </div>
                  <div className="flex items-baseline justify-between font-mono text-[11px] text-[#05251C]/60 pt-1">
                    <span className="font-semibold text-[#05251C]">
                      {item.title}
                    </span>
                    <span>{item.code}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 2 */}
            <div
              ref={col2Ref}
              className="space-y-8 sm:space-y-12 sm:pt-16 lg:pt-24"
            >
              {itemsCol2.map((item) => (
                <div key={item.id} className="group space-y-3">
                  <div className="clip-reveal-card relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 border border-[#05251C]/10 shadow-xs">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="clip-reveal-img h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                      onLoad={() => ScrollTrigger.refresh()}
                    />
                  </div>
                  <div className="flex items-baseline justify-between font-mono text-[11px] text-[#05251C]/60 pt-1">
                    <span className="font-semibold text-[#05251C]">
                      {item.title}
                    </span>
                    <span>{item.code}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandChapterSection;
