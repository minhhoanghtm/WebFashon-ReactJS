import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { getLookbooksService } from "@/services/page.service";
import HOME_CONTENT from "../content";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const BrandChapterSection = () => {
  const containerRef = useRef(null);
  const colLeftRef = useRef(null);
  const col1Ref = useRef(null);
  const col2Ref = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const [lookbookImages, setLookbookImages] = useState([]);

  // Fetch real lookbook images from API
  useEffect(() => {
    let isMounted = true;
    const fetchImages = async () => {
      try {
        const res = await getLookbooksService({ limit: 4 });
        const list = res.pages || res.data || [];
        if (!isMounted || !Array.isArray(list) || list.length === 0) return;

        const imgs = list
          .map((item, idx) => ({
            id: item._id || item.id || `lb-${idx}`,
            title: item.title || `ẤN BẢN ATELIER 0${idx + 1}`,
            subtitle: item.excerpt || "Kỹ nghệ may đo chuẩn mực",
            imageUrl: item.cover || item.thumbnail || item.image || "",
            code: `ED-0${idx + 1}`,
          }))
          .filter((item) => Boolean(item.imageUrl));

        if (imgs.length > 0) {
          setLookbookImages(imgs);
        }
      } catch {
        // Fallback to architectural placeholders
      }
    };

    fetchImages();
    return () => {
      isMounted = false;
    };
  }, []);

  // Default items if API is empty or loading
  const displayItems = useMemo(
    () =>
      lookbookImages.length >= 2
        ? lookbookImages
        : [
            {
              id: "chapter-item-1",
              title: "ÁO KHOÁC MAY ĐO CẤU TRÚC",
              subtitle: "Phom dáng hình học đơn sắc",
              imageUrl: "",
              code: "AT-01",
            },
            {
              id: "chapter-item-2",
              title: "SƠ MI KHỐI HỘP",
              subtitle: "Đường cắt chuẩn mực",
              imageUrl: "",
              code: "AT-02",
            },
            {
              id: "chapter-item-3",
              title: "QUẦN TÂY ỐNG ĐỨNG TỐI GIẢN",
              subtitle: "Tỷ lệ cơ thể đương đại",
              imageUrl: "",
              code: "AT-03",
            },
            {
              id: "chapter-item-4",
              title: "TÚI XÁCH HÌNH HỌC",
              subtitle: "Chi tiết tinh giản tuyệt đối",
              imageUrl: "",
              code: "AT-04",
            },
          ],
    [lookbookImages]
  );

  // GSAP Animations: Clip-path reveal + Multi-speed Column Parallax
  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current) return undefined;

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768;

      // 1. Text reveal mask on left heading
      const headingLines = containerRef.current.querySelectorAll(
        ".brand-heading-line"
      );
      if (headingLines.length > 0) {
        gsap.fromTo(
          headingLines,
          { y: "100%", opacity: 0 },
          {
            y: "0%",
            opacity: 1,
            duration: 0.9,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: colLeftRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // 2. Clip-path reveal on image cards
      const imageCards = containerRef.current.querySelectorAll(".clip-reveal-card");
      imageCards.forEach((card) => {
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

    // Refresh ScrollTrigger after DOM settle
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

  const { brandChapter } = HOME_CONTENT;

  return (
    <section
      ref={containerRef}
      aria-label="Chương thương hiệu: Triết lý cấu trúc may đo"
      className="relative z-10 bg-white text-[#05251C] px-4 py-20 sm:px-8 sm:py-32 lg:px-14 lg:py-40 border-t border-[#05251C]/10"
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16 items-start">
          {/* Left Column: Brand Manifesto Narrative (~40%) */}
          <div
            ref={colLeftRef}
            className="lg:col-span-5 lg:sticky lg:top-28 space-y-8"
          >
            {/* Chapter eyebrow */}
            <div className="space-y-1">
              <span className="font-mono text-xs tracking-[0.28em] text-[#05251C]/60 uppercase">
                {brandChapter.eyebrow}
              </span>
              <div className="h-[1px] w-16 bg-[#05251C]/20" />
            </div>

            {/* Giant Condensed Heading with mask reveal */}
            <div className="overflow-hidden">
              <h2 className="font-condensed text-5xl font-bold uppercase tracking-tight text-[#05251C] sm:text-6xl lg:text-7xl leading-[1.18] sm:leading-[1.2] py-[0.12em]">
                {brandChapter.headingLines.map((line, idx) => (
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

            {/* Narrative Paragraph */}
            <p className="max-w-md font-sans text-sm font-normal leading-relaxed text-[#05251C]/75 sm:text-base">
              {brandChapter.description}
            </p>

            {/* CTA Link to existing /products route */}
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

          {/* Right Column: 2 Staggered Columns with Parallax & Clip-path reveal (~60%) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            {/* Column 1 (Left of pair) */}
            <div ref={col1Ref} className="space-y-8 sm:space-y-12">
              {itemsCol1.map((item) => (
                <div key={item.id} className="group space-y-3">
                  <div className="clip-reveal-card relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 border border-[#05251C]/10 shadow-xs">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="clip-reveal-img h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                        onLoad={() => ScrollTrigger.refresh()}
                      />
                    ) : (
                      /* Minimalist Monochrome Canvas Placeholder */
                      <div className="clip-reveal-img h-full w-full bg-gradient-to-b from-neutral-100 via-neutral-200 to-neutral-300 flex flex-col justify-between p-6">
                        <span className="font-mono text-[10px] text-[#05251C]/40 tracking-widest uppercase">
                          {item.code}
                        </span>
                        <div className="text-center space-y-1">
                          <span className="font-condensed text-2xl font-bold uppercase tracking-wider text-[#05251C]/80 block">
                            {item.title}
                          </span>
                          <span className="font-sans text-[11px] text-[#05251C]/50 block">
                            {item.subtitle}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-[#05251C]/30 text-right uppercase">
                          404 ATELIER
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Caption underneath */}
                  <div className="flex items-baseline justify-between font-mono text-[11px] text-[#05251C]/60 pt-1">
                    <span className="font-semibold text-[#05251C]">
                      {item.title}
                    </span>
                    <span>{item.code}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 2 (Right of pair, offset downwards for staggered flow) */}
            <div
              ref={col2Ref}
              className="space-y-8 sm:space-y-12 sm:pt-16 lg:pt-24"
            >
              {itemsCol2.map((item) => (
                <div key={item.id} className="group space-y-3">
                  <div className="clip-reveal-card relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 border border-[#05251C]/10 shadow-xs">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="clip-reveal-img h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                        onLoad={() => ScrollTrigger.refresh()}
                      />
                    ) : (
                      /* Minimalist Monochrome Canvas Placeholder */
                      <div className="clip-reveal-img h-full w-full bg-gradient-to-b from-neutral-200 via-neutral-100 to-neutral-200 flex flex-col justify-between p-6">
                        <span className="font-mono text-[10px] text-[#05251C]/40 tracking-widest uppercase">
                          {item.code}
                        </span>
                        <div className="text-center space-y-1">
                          <span className="font-condensed text-2xl font-bold uppercase tracking-wider text-[#05251C]/80 block">
                            {item.title}
                          </span>
                          <span className="font-sans text-[11px] text-[#05251C]/50 block">
                            {item.subtitle}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-[#05251C]/30 text-right uppercase">
                          404 ATELIER
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Caption underneath */}
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
