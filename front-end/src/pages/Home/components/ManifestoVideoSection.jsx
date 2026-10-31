import React, { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import HOME_CONTENT from "../content";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const ManifestoVideoSection = () => {
  const sectionRef = useRef(null);
  const textContainerRef = useRef(null);
  const videoWrapperRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const { manifesto } = HOME_CONTENT;

  useEffect(() => {
    if (prefersReducedMotion || !sectionRef.current) return undefined;

    const ctx = gsap.context(() => {
      // 1. Text scrub: words light up as user scrolls through
      const wordElements = textContainerRef.current?.querySelectorAll(".manifesto-word");
      if (wordElements && wordElements.length > 0) {
        gsap.fromTo(
          wordElements,
          { opacity: 0.18, y: 15 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            ease: "none",
            scrollTrigger: {
              trigger: textContainerRef.current,
              start: "top 75%",
              end: "bottom 45%",
              scrub: 0.8,
            },
          }
        );
      }

      // 2. Video container expansion: scales from 0.86 to 1.0 (full-bleed)
      if (videoWrapperRef.current) {
        gsap.fromTo(
          videoWrapperRef.current,
          {
            scale: 0.86,
            borderRadius: "16px",
          },
          {
            scale: 1.0,
            borderRadius: "0px",
            ease: "none",
            scrollTrigger: {
              trigger: videoWrapperRef.current,
              start: "top 85%",
              end: "top 25%",
              scrub: 1.0,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <section
      ref={sectionRef}
      aria-label="Tuyên ngôn thương hiệu và phim tư liệu"
      className="relative z-10 bg-[#050608] text-white py-24 sm:py-36 overflow-hidden"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-14">
        {/* Slogan Container */}
        <div
          ref={textContainerRef}
          className="mx-auto max-w-4xl text-center space-y-6 sm:space-y-8"
        >
          <div className="overflow-hidden">
            <span className="font-mono text-xs tracking-[0.32em] text-white/50 uppercase">
              {manifesto.eyebrow}
            </span>
          </div>

          {/* Slogan Words that light up on scroll */}
          <h3 className="font-condensed text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight leading-[1.08] select-none">
            {manifesto.words.map((word, idx) => (
              <span
                key={`${word}-${idx}`}
                className="manifesto-word inline-block mx-1.5 transition-colors will-change-[opacity,transform]"
                style={{ opacity: prefersReducedMotion ? 1 : 0.18 }}
              >
                {word}
              </span>
            ))}
          </h3>

          <p className="mx-auto max-w-lg font-sans text-xs sm:text-sm font-normal text-white/60 leading-relaxed tracking-wider">
            {manifesto.description}
          </p>
        </div>
      </div>

      {/* Video / Visual container that expands on scroll */}
      <div className="mt-16 sm:mt-24 w-full flex justify-center">
        <div
          ref={videoWrapperRef}
          className="relative w-full max-w-[1600px] aspect-[16/9] sm:aspect-[21/9] min-h-[360px] sm:min-h-[500px] overflow-hidden bg-neutral-950 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] will-change-transform flex items-center justify-center select-none"
        >
          {/* Architectural Monochrome Visual Loop Canvas (Self-contained, no external URL) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-[#0c0d11] to-[#040405]">
            {/* Subtle animated geometric lines */}
            <div
              className={`absolute inset-0 opacity-[0.06] transition-opacity duration-700 ${
                isPlaying ? "opacity-[0.14]" : ""
              }`}
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Central Interactive State Canvas */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/40">
              {manifesto.videoSubtitle}
            </span>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Tạm dừng hiển thị" : "Bật trải nghiệm tư liệu Atelier"}
              className="group relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border border-white/40 bg-black/50 backdrop-blur-md text-white transition-all duration-500 hover:scale-110 hover:border-white hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              {isPlaying ? (
                <Pause size={24} className="fill-current" />
              ) : (
                <Play size={24} className="ml-1 fill-current" />
              )}
            </button>

            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/60">
              {isPlaying ? "ĐANG HOẠT ĐỘNG" : "KHỞI CHẠY TƯ LIỆU"}
            </span>
          </div>

          {/* Bottom Video Metadata */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white/50 font-mono text-[11px] pointer-events-none">
            <span className="tracking-widest uppercase">
              CHAPTER 02 / MONOCHROME ARCHITECTURE
            </span>
            <span className="tabular-nums uppercase">404 ATELIER · ARCHIVE</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManifestoVideoSection;
