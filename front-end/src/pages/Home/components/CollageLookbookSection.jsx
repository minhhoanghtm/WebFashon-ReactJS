import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { getLookbooksService } from "@/services/page.service";
import CinematicWhiteTransition from "./CinematicWhiteTransition";
import HOME_CONTENT from "../content";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const CollageLookbookSection = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const centerContentRef = useRef(null);

  const img1Ref = useRef(null); // Top Left
  const img2Ref = useRef(null); // Top Right
  const img3Ref = useRef(null); // Bottom Left
  const img4Ref = useRef(null); // Bottom Right

  const [lookbooks, setLookbooks] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const { collage } = HOME_CONTENT;

  // Fetch real lookbook items from API
  useEffect(() => {
    let isMounted = true;
    const fetchLookbooks = async () => {
      try {
        const res = await getLookbooksService({ limit: 4 });
        const list = res.pages || res.data || [];
        if (!isMounted || !Array.isArray(list) || list.length === 0) return;

        const mapped = list
          .map((item, idx) => ({
            id: item._id || item.id || `lookbook-${idx}`,
            title: item.title || `BỘ SƯU TẬP 0${idx + 1}`,
            subtitle: item.excerpt || "Ấn bản nghệ thuật",
            cover: item.cover || item.thumbnail || item.image || "",
            code: `LOOK-0${idx + 1}`,
          }))
          .filter((item) => Boolean(item.cover));

        if (mapped.length > 0) {
          setLookbooks(mapped);
        }
      } catch {
        // Fallback to placeholders
      }
    };

    fetchLookbooks();
    return () => {
      isMounted = false;
    };
  }, []);

  const items = useMemo(() => {
    return lookbooks.length >= 4
      ? lookbooks
      : [
          {
            id: "collage-1",
            title: "ÁNH SÁNG & BÓNG TỐI",
            subtitle: "Studio Edit",
            cover: "",
            code: "VOL-01",
          },
          {
            id: "collage-2",
            title: "ĐƯỜNG NÉT THỦ CÔNG",
            subtitle: "Atelier Tailoring",
            cover: "",
            code: "VOL-02",
          },
          {
            id: "collage-3",
            title: "DẠNG THỨC ĐƠN SẮC",
            subtitle: "Monochrome Study",
            cover: "",
            code: "VOL-03",
          },
          {
            id: "collage-4",
            title: "CHUYỂN ĐỘNG TỰ DO",
            subtitle: "Fluid Silhouette",
            cover: "",
            code: "VOL-04",
          },
        ];
  }, [lookbooks]);

  // GSAP Parallax & Convergence Animation
  useEffect(() => {
    if (prefersReducedMotion || !sectionRef.current) return undefined;

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768;

      if (!isMobile) {
        // Top-left image: moves slightly down & inwards
        if (img1Ref.current) {
          gsap.fromTo(
            img1Ref.current,
            { y: -70, x: -30, scale: 0.95 },
            {
              y: 50,
              x: 10,
              scale: 1.04,
              ease: "none",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            }
          );
        }

        // Top-right image: moves faster down & inwards
        if (img2Ref.current) {
          gsap.fromTo(
            img2Ref.current,
            { y: 60, x: 30, scale: 0.92 },
            {
              y: -80,
              x: -15,
              scale: 1.05,
              ease: "none",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.5,
              },
            }
          );
        }

        // Bottom-left image: moves up & inwards
        if (img3Ref.current) {
          gsap.fromTo(
            img3Ref.current,
            { y: 90, x: -20, scale: 0.94 },
            {
              y: -60,
              x: 10,
              scale: 1.02,
              ease: "none",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.4,
              },
            }
          );
        }

        // Bottom-right image: moves down & inwards
        if (img4Ref.current) {
          gsap.fromTo(
            img4Ref.current,
            { y: -60, x: 25, scale: 0.96 },
            {
              y: 80,
              x: -10,
              scale: 1.03,
              ease: "none",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.1,
              },
            }
          );
        }
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  // Handle CTA Click: Trigger White Screen + Logo page transition (duration <= 0.6s)
  // Directs to safe existing route /products
  const handleExploreLookbook = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate("/products");
    }, 450);
  };

  return (
    <>
      {/* White Page Transition Overlay */}
      <CinematicWhiteTransition isVisible={isTransitioning} />

      <section
        ref={sectionRef}
        aria-label="Collage Lookbook đương đại"
        className="relative z-10 min-h-[900px] lg:min-h-[1100px] w-full overflow-hidden bg-[#FBF9F5] text-[#05251C] py-24 sm:py-36 flex items-center justify-center border-t border-[#05251C]/10"
      >
        {/* Scattered Images around the perimeter (Parallax & Edge feathered) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          {/* 1. Top Left Image Card */}
          <div
            ref={img1Ref}
            className="absolute top-[8%] left-[4%] sm:left-[8%] w-[200px] sm:w-[260px] lg:w-[320px] aspect-[3/4] border border-[#05251C]/10 bg-white shadow-xl overflow-hidden [mask-image:radial-gradient(circle_at_center,black_70%,transparent_100%)]"
          >
            {items[0].cover ? (
              <img
                src={items[0].cover}
                alt={items[0].title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-neutral-100 to-neutral-300 flex flex-col justify-between p-4">
                <span className="font-mono text-[9px] text-[#05251C]/40">
                  {items[0].code}
                </span>
                <span className="font-condensed text-xl font-bold uppercase text-[#05251C]/70">
                  {items[0].title}
                </span>
              </div>
            )}
          </div>

          {/* 2. Top Right Image Card */}
          <div
            ref={img2Ref}
            className="absolute top-[12%] right-[4%] sm:right-[7%] w-[220px] sm:w-[280px] lg:w-[340px] aspect-[3/4] border border-[#05251C]/10 bg-white shadow-xl overflow-hidden [mask-image:radial-gradient(circle_at_center,black_70%,transparent_100%)]"
          >
            {items[1].cover ? (
              <img
                src={items[1].cover}
                alt={items[1].title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-bl from-neutral-200 to-neutral-400 flex flex-col justify-between p-4">
                <span className="font-mono text-[9px] text-[#05251C]/40">
                  {items[1].code}
                </span>
                <span className="font-condensed text-xl font-bold uppercase text-[#05251C]/70">
                  {items[1].title}
                </span>
              </div>
            )}
          </div>

          {/* 3. Bottom Left Image Card */}
          <div
            ref={img3Ref}
            className="absolute bottom-[6%] left-[3%] sm:left-[6%] w-[230px] sm:w-[290px] lg:w-[350px] aspect-[4/3] border border-[#05251C]/10 bg-white shadow-xl overflow-hidden [mask-image:radial-gradient(circle_at_center,black_70%,transparent_100%)]"
          >
            {items[2].cover ? (
              <img
                src={items[2].cover}
                alt={items[2].title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-tr from-neutral-100 to-neutral-300 flex flex-col justify-between p-4">
                <span className="font-mono text-[9px] text-[#05251C]/40">
                  {items[2].code}
                </span>
                <span className="font-condensed text-xl font-bold uppercase text-[#05251C]/70">
                  {items[2].title}
                </span>
              </div>
            )}
          </div>

          {/* 4. Bottom Right Image Card */}
          <div
            ref={img4Ref}
            className="absolute bottom-[8%] right-[3%] sm:right-[6%] w-[210px] sm:w-[270px] lg:w-[330px] aspect-[3/4] border border-[#05251C]/10 bg-white shadow-xl overflow-hidden [mask-image:radial-gradient(circle_at_center,black_70%,transparent_100%)]"
          >
            {items[3].cover ? (
              <img
                src={items[3].cover}
                alt={items[3].title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-tl from-neutral-200 to-neutral-300 flex flex-col justify-between p-4">
                <span className="font-mono text-[9px] text-[#05251C]/40">
                  {items[3].code}
                </span>
                <span className="font-condensed text-xl font-bold uppercase text-[#05251C]/70">
                  {items[3].title}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center Narrative Core: Big Title + Description + Thin CTA Button */}
        <div
          ref={centerContentRef}
          className="relative z-20 mx-auto max-w-2xl px-6 text-center space-y-6"
        >
          <div className="overflow-hidden">
            <span className="font-mono text-xs tracking-[0.3em] uppercase text-[#05251C]/60">
              {collage.eyebrow}
            </span>
          </div>

          <h3 className="font-condensed text-5xl sm:text-7xl lg:text-8xl font-bold uppercase tracking-tight text-[#05251C] leading-[0.92]">
            {collage.title}
            <span className="block text-[#05251C]/45">{collage.subtitle}</span>
          </h3>

          <p className="mx-auto max-w-md font-sans text-xs sm:text-sm font-normal text-[#05251C]/75 leading-relaxed tracking-wider">
            {collage.description}
          </p>

          <div className="pt-4">
            <button
              type="button"
              onClick={handleExploreLookbook}
              className="group inline-flex min-h-[48px] items-center gap-3 border border-[#05251C]/40 bg-transparent px-8 py-3.5 text-xs font-semibold tracking-[0.26em] text-[#05251C] uppercase transition-all duration-500 hover:border-[#05251C] hover:bg-[#05251C] hover:text-[#FBF9F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#05251C]"
            >
              <span>{collage.cta}</span>
              <ArrowUpRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default CollageLookbookSection;
