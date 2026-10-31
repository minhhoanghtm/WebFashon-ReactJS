import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, LayoutGrid, MoveHorizontal } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import HOME_CONTENT from "../content";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const HorizontalTimelineSection = ({ categories = [] }) => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const progressBarRef = useRef(null);

  const [viewMode, setViewMode] = useState("timeline"); // 'timeline' | 'grid'
  const prefersReducedMotion = usePrefersReducedMotion();

  const { timeline } = HOME_CONTENT;

  // Build timeline items from real categories or fallback to structural chapters
  const timelineItems = useMemo(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      const valid = categories.filter((c) => (c._id || c.id) && c.name);
      if (valid.length >= 3) {
        return valid.slice(0, 5).map((cat, idx) => ({
          id: cat._id || cat.id,
          chapterNum: `0${idx + 1}`,
          chapterLabel: `GIAI ĐOẠN 0${idx + 1}`,
          title: cat.name,
          description:
            cat.description ||
            `Tập trung vào các thiết kế may đo ${cat.name.toLowerCase()} với phom dáng chuẩn mực và đường nét tối giản.`,
          imageUrl: cat.image || cat.imageUrl || "",
          code: `AT-CAT.0${idx + 1}`,
        }));
      }
    }

    return [
      {
        id: "timeline-1",
        chapterNum: "01",
        chapterLabel: "CHƯƠNG 01",
        title: "KHỞI NGUYÊN HÌNH HỌC",
        description:
          "Nghiên cứu tỷ lệ cơ thể và phát triển các đường cắt phẳng đơn sắc không chi tiết thừa.",
        imageUrl: "",
        code: "GENESIS-01",
      },
      {
        id: "timeline-2",
        chapterNum: "02",
        chapterLabel: "CHƯƠNG 02",
        title: "XỬ LÝ CHẤT LIỆU",
        description:
          "Tuyển chọn sợi tự nhiên len dệt, lụa và linen thô với bề mặt xúc giác nguyên bản.",
        imageUrl: "",
        code: "FABRIC-02",
      },
      {
        id: "timeline-3",
        chapterNum: "03",
        chapterLabel: "CHƯƠNG 03",
        title: "MAY ĐO ĐƠN SẮC",
        description:
          "Hoàn thiện từng sản phẩm thủ công với độ chính xác cao độ của kỹ nghệ may đo kiến trúc.",
        imageUrl: "",
        code: "TAILOR-03",
      },
      {
        id: "timeline-4",
        chapterNum: "04",
        chapterLabel: "CHƯƠNG 04",
        title: "BẢN SẮC ĐƯƠNG ĐẠI",
        description:
          "Giải phóng phom dáng để người mặc đạt tới sự thoải mái và tự do biểu cảm tuyệt đối.",
        imageUrl: "",
        code: "ATELIER-04",
      },
    ];
  }, [categories]);

  // GSAP Horizontal Pin Scroll on Desktop
  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current || !trackRef.current) {
      return undefined;
    }

    const isMobile = window.innerWidth < 768;
    if (isMobile || viewMode === "grid") return undefined;

    const ctx = gsap.context(() => {
      const totalPanels = timelineItems.length;
      const xPercentMove = -100 * ((totalPanels - 1) / totalPanels);

      const timelineAnim = gsap.to(trackRef.current, {
        xPercent: xPercentMove,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 1.1,
          start: "top top",
          end: () => `+=${window.innerWidth * (totalPanels - 1) * 0.85}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressBarRef.current) {
              progressBarRef.current.style.width = `${self.progress * 100}%`;
            }
          },
        },
      });

      return () => {
        timelineAnim.scrollTrigger?.kill();
      };
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion, timelineItems.length, viewMode]);

  return (
    <section
      ref={containerRef}
      aria-label="Tiến trình sáng tạo bộ sưu tập"
      className="relative z-10 bg-[#090a0d] text-white border-t border-white/10 overflow-hidden"
    >
      {/* Section Header */}
      <div className="mx-auto max-w-[1600px] px-4 pt-16 sm:px-8 sm:pt-24 lg:px-14">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end border-b border-white/10 pb-8">
          <div>
            <span className="font-mono text-xs tracking-[0.3em] uppercase text-white/50">
              {timeline.eyebrow}
            </span>
            <h2 className="mt-2 font-condensed text-4xl sm:text-6xl font-extrabold uppercase tracking-tight text-white leading-none">
              {timeline.title}
            </h2>
            <p className="mt-3 max-w-xl font-sans text-xs sm:text-sm text-white/60 leading-relaxed">
              {timeline.description}
            </p>
          </div>

          {/* Mode Switch Toggle Button (Desktop & Mobile) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setViewMode((prev) => (prev === "timeline" ? "grid" : "timeline"))
              }
              className="inline-flex min-h-[44px] items-center gap-2 border border-white/20 px-4 py-2 text-xs font-semibold tracking-[0.2em] uppercase text-white transition-colors hover:border-white hover:bg-white hover:text-black"
            >
              {viewMode === "timeline" ? (
                <>
                  <LayoutGrid size={14} />
                  <span>{timeline.toggleGrid}</span>
                </>
              ) : (
                <>
                  <MoveHorizontal size={14} />
                  <span>{timeline.toggleTimeline}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Horizontal Track (Pinned on Desktop, Vertical on Mobile) */}
      {viewMode === "timeline" ? (
        <div className="relative w-full overflow-hidden py-12 sm:py-20">
          <div
            ref={trackRef}
            className="flex flex-col md:flex-row md:flex-nowrap gap-8 md:gap-0 will-change-transform"
            style={{
              width:
                typeof window !== "undefined" && window.innerWidth >= 768
                  ? `${timelineItems.length * 100}vw`
                  : "100%",
            }}
          >
            {timelineItems.map((item) => (
              <div
                key={item.id}
                className="w-full md:w-screen flex-shrink-0 px-4 sm:px-8 lg:px-16 flex items-center justify-center"
              >
                <div className="mx-auto w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center">
                  {/* Left Column: Big Chapter Number, Heading & Paragraph (~50%) */}
                  <div className="md:col-span-6 space-y-6">
                    <div className="flex items-baseline gap-4">
                      <span className="font-condensed text-7xl sm:text-9xl font-black text-white/15 tabular-nums leading-none select-none">
                        {item.chapterNum}
                      </span>
                      <span className="font-mono text-xs tracking-[0.28em] text-white/50 uppercase">
                        {item.chapterLabel}
                      </span>
                    </div>

                    <h3 className="font-condensed text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
                      {item.title}
                    </h3>

                    <p className="font-sans text-xs sm:text-sm text-white/70 leading-relaxed max-w-md">
                      {item.description}
                    </p>

                    <div className="pt-2">
                      <Link
                        to="/products"
                        className="group inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold tracking-[0.24em] text-white uppercase transition-colors hover:text-white/70"
                      >
                        <span>KHÁM PHÁ THIẾT KẾ</span>
                        <ArrowUpRight
                          size={15}
                          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </Link>
                    </div>
                  </div>

                  {/* Right Column: 3:4 Standalone Portrait Artwork Canvas (~50%) */}
                  <div className="md:col-span-6 flex justify-center">
                    <div className="relative aspect-[3/4] w-full max-w-md overflow-hidden border border-white/15 bg-neutral-900 shadow-2xl">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        /* Architectural Monochrome Timeline Canvas */
                        <div className="h-full w-full bg-gradient-to-tr from-black via-neutral-900 to-neutral-800 p-8 flex flex-col justify-between">
                          <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
                            {item.code}
                          </span>
                          <div className="space-y-2 text-center">
                            <span className="font-condensed text-3xl font-extrabold tracking-wider uppercase text-white/80 block">
                              {item.title}
                            </span>
                            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40 block">
                              ATELIER TIMELINE
                            </span>
                          </div>
                          <span className="font-mono text-[9px] tracking-widest text-white/30 text-right uppercase">
                            EDITION 2026
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Progress Bar on Desktop */}
          <div className="hidden md:block mx-auto max-w-[1600px] px-14 pt-8">
            <div className="h-[2px] w-full bg-white/10 relative overflow-hidden">
              <div
                ref={progressBarRef}
                className="absolute top-0 left-0 bottom-0 bg-white transition-[width] duration-75"
                style={{ width: "0%" }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Mode 2: Grid Overview of All Chapters */
        <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-8 sm:py-24 lg:px-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {timelineItems.map((item) => (
              <div
                key={`grid-${item.id}`}
                className="group border border-white/10 bg-neutral-900/60 p-6 space-y-4 hover:border-white/30 transition-colors"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-900 border border-white/10">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
                      <span className="font-condensed text-4xl font-extrabold text-white/20">
                        {item.chapterNum}
                      </span>
                      <span className="font-mono text-[9px] text-white/40 tracking-widest mt-2 uppercase">
                        {item.code}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
                    {item.chapterLabel}
                  </span>
                  <h4 className="font-condensed text-xl font-bold uppercase text-white">
                    {item.title}
                  </h4>
                  <p className="font-sans text-xs text-white/60 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default HorizontalTimelineSection;
