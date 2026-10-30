import React from "react";
import { ArrowDown, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import summerLookImage from "../../Home/assets/lookbook-summer.jpg";
import eveningLookImage from "../../Home/assets/lookbook-evening.jpg";

export const LookbookMagazineHero = () => {
  const prefersReduced = usePrefersReducedMotion();

  const handleScrollDown = () => {
    const nextSection = document.getElementById("lookbook-collage");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative w-full min-h-[80vh] lg:min-h-[88vh] bg-[#062D22] text-[#F7F6F1] flex items-center justify-center overflow-hidden py-16 px-4 sm:px-6 lg:px-8 select-none">
      {/* Editorial subtle grain overlay */}
      <div className="editorial-grain-overlay absolute inset-0 z-0 pointer-events-none opacity-20" aria-hidden="true" />

      {/* Decorative ambient gradients */}
      <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-[#DCE84A]/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col justify-between min-h-[72vh]">
        {/* Top Eyebrow */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-[#DCE84A] text-[11px] font-black tracking-[0.25em] uppercase border border-white/15 backdrop-blur-md">
            <Sparkles size={12} />
            <span>EDITORIAL VISUAL ESSAY 2026</span>
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#747974] hidden sm:inline">
            ARCHIVE · CONTEMPORARY TAILORING
          </span>
        </div>

        {/* Center: Massive Headline & Asymmetric Photo Spread */}
        <div className="my-auto py-8 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#DCE84A] block mb-3 font-mono">
              VOLUME 04 / EXHIBITION
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black text-[#F7F6F1] uppercase leading-[0.9] tracking-tight">
              INSIDE OUR<br />
              CREATIVE<br />
              <span className="text-[#DCE84A]">WORLD.</span>
            </h1>
            <p className="mt-6 text-sm sm:text-base text-[#D1D9CF] font-medium max-w-lg leading-relaxed">
              Khám phá ngôn ngữ thị giác đầy tính thể nghiệm của 404Studio qua những khung hình may đo đương đại đậm chất streetwear.
            </p>
          </div>

          {/* Asymmetric Editorial Dual Photo Collage */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-56 sm:w-64 aspect-[3/4] rounded-2xl overflow-hidden border border-white/15 shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <img
                src={summerLookImage}
                alt="Summer Editorial Look"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 text-[10px] font-extrabold tracking-widest uppercase text-white/90">
                SERIES 01 · SUMMER NOCTURNE
              </span>
            </div>

            <div className="hidden sm:block absolute -right-12 -bottom-6 w-44 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#DCE84A] shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-500">
              <img
                src={eveningLookImage}
                alt="Evening Editorial Look"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 text-[9px] font-extrabold tracking-widest uppercase text-[#DCE84A]">
                SERIES 02 · ATELIER
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Scroll action */}
        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[#747974]">
            ATELIER LOOKBOOK COLLECTION
          </span>

          <button
            type="button"
            onClick={handleScrollDown}
            className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#F7F6F1] hover:text-[#DCE84A] transition-colors cursor-pointer group"
          >
            <span>Khám phá các bộ sưu tập</span>
            <div className="w-8 h-8 rounded-full bg-[#DCE84A] text-[#062D22] flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowDown size={14} className="animate-bounce" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default LookbookMagazineHero;

