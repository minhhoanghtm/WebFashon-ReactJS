import React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Sparkles, ArrowDown } from "lucide-react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

export const AboutEditorialHero = () => {
  const containerRef = React.useRef(null);
  const prefersReduced = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[85vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#062D22] select-none"
    >
      {/* Editorial Grain Overlay */}
      <div className="editorial-grain-overlay absolute inset-0 z-0 pointer-events-none opacity-20" aria-hidden="true" />

      {/* Subtle deep forest ambient radiance */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[#DCE84A]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[500px] h-[500px] rounded-full bg-[#041E17]/80 blur-2xl pointer-events-none" />

      <motion.div
        style={prefersReduced ? {} : { y: heroY, opacity: heroOpacity }}
        className="relative z-10 mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-between min-h-[75vh] py-14"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-black tracking-[0.25em] text-[#DCE84A] uppercase backdrop-blur-md shadow-xs">
            <Sparkles size={12} />
            <span>ORIGIN STORY · 404STUDIO ATELIER</span>
          </div>
        </div>

        <div className="my-auto py-8">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#747974] block mb-3">
            MANIFESTO 2026
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black text-[#F7F6F1] uppercase leading-[0.92] tracking-tight">
            WHO WE ARE.<br />
            <span className="text-[#DCE84A]">CREATING OUR</span><br />
            OWN IDENTITY.
          </h1>

          <p className="mt-6 text-sm sm:text-base text-[#D1D9CF] max-w-xl font-medium leading-relaxed">
            Chúng tôi tin rằng trang phục không chỉ là lớp vải bao bọc bên ngoài. Đó là tác phẩm kiến trúc biết chuyển động, phản chiếu câu chuyện nội tâm và định hình phong thái của mỗi người.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-6 text-xs font-bold uppercase tracking-widest text-[#D1D9CF]/60">
          <span>DESIGNED WITH INTENTION</span>
          <div className="flex items-center gap-2 text-[#DCE84A]">
            <span>Cuộn để khám phá</span>
            <ArrowDown size={14} className="animate-bounce" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AboutEditorialHero;

