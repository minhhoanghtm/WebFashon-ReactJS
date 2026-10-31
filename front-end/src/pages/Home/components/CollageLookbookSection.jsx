import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { getLookbooksService } from "@/services/page.service";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import CinematicWhiteTransition from "./CinematicWhiteTransition";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const CollageLookbookSection = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const centerContentRef = useRef(null);

  const img1Ref = useRef(null);
  const img2Ref = useRef(null);
  const img3Ref = useRef(null);
  const img4Ref = useRef(null);

  const [lookbooks, setLookbooks] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const { settings } = useWebsiteSettings();
  const collage = settings?.homeContent?.collage || {
    eyebrow: "CHƯƠNG 03 · TUYỂN TẬP HÌNH ẢNH",
    title: "COLLAGE",
    subtitle: "LOOKBOOK",
    description:
      "Sự đối thoại giữa phom dáng tối giản và không gian kiến trúc. Khám phá toàn cảnh các thiết kế được ghi hình qua lăng kính điện ảnh đương đại.",
    cta: "KHÁM PHÁ TOÀN BỘ BỘ SƯU TẬP",
  };

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
            cover: item.thumbnailUrl || item.cover || item.thumbnail || item.image || item.bannerUrl || "",
            code: `LOOK-0${idx + 1}`,
          }))
          .filter((item) => Boolean(item.cover));

        if (mapped.length > 0) {
          setLookbooks(mapped);
        }
      } catch {
        // Silently handled
      }
    };

    fetchLookbooks();
    return () => {
      isMounted = false;
    };
  }, []);

  const items = lookbooks;

  // GSAP Parallax & Convergence Animation
  useEffect(() => {
    if (prefersReducedMotion || !sectionRef.current || items.length === 0) return undefined;

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768;

      if (!isMobile) {
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
  }, [prefersReducedMotion, items]);

  const handleExploreLookbook = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate("/products");
    }, 450);
  };

  return (
    <>
      <CinematicWhiteTransition isVisible={isTransitioning} />

      <section
        ref={sectionRef}
        aria-label="Collage Lookbook đương đại"
        className="relative z-10 min-h-[900px] lg:min-h-[1100px] w-full overflow-hidden bg-[#FBF9F5] text-[#05251C] py-24 sm:py-36 flex items-center justify-center border-t border-[#05251C]/10"
      >
        {/* Scattered Real Images */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          {items[0] && (
            <div
              ref={img1Ref}
              className="absolute top-[8%] left-[4%] sm:left-[8%] w-[200px] sm:w-[260px] lg:w-[320px] aspect-[3/4] border border-[#05251C]/10 bg-white shadow-xl overflow-hidden [mask-image:radial-gradient(circle_at_center,black_70%,transparent_100%)]"
            >
              <img
                src={items[0].cover}
                alt={items[0].title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {items[1] && (
            <div
              ref={img2Ref}
              className="absolute top-[12%] right-[4%] sm:right-[7%] w-[220px] sm:w-[280px] lg:w-[340px] aspect-[3/4] border border-[#05251C]/10 bg-white shadow-xl overflow-hidden [mask-image:radial-gradient(circle_at_center,black_70%,transparent_100%)]"
            >
              <img
                src={items[1].cover}
                alt={items[1].title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {items[2] && (
            <div
              ref={img3Ref}
              className="absolute bottom-[6%] left-[3%] sm:left-[6%] w-[230px] sm:w-[290px] lg:w-[350px] aspect-[4/3] border border-[#05251C]/10 bg-white shadow-xl overflow-hidden [mask-image:radial-gradient(circle_at_center,black_70%,transparent_100%)]"
            >
              <img
                src={items[2].cover}
                alt={items[2].title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {items[3] && (
            <div
              ref={img4Ref}
              className="absolute bottom-[8%] right-[3%] sm:right-[6%] w-[210px] sm:w-[270px] lg:w-[330px] aspect-[3/4] border border-[#05251C]/10 bg-white shadow-xl overflow-hidden [mask-image:radial-gradient(circle_at_center,black_70%,transparent_100%)]"
            >
              <img
                src={items[3].cover}
                alt={items[3].title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>

        {/* Center Narrative Core */}
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
