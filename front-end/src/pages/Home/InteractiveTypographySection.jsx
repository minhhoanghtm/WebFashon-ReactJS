import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, RefreshCw, Compass } from "lucide-react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

const messages = [
  {
    title: "WEAR YOUR STORY",
    subtitle: "Trang phục bạn chọn là bản tuyên ngôn không lời về cái tôi độc bản.",
    tag: "01 / IDENTITY",
  },
  {
    title: "EXPRESS YOUR ESSENCE",
    subtitle: "Mỗi đường kim mũi chỉ định hình một phong thái tự tin và khác biệt.",
    tag: "02 / ATTITUDE",
  },
  {
    title: "SHAPED BY DETAIL",
    subtitle: "Cấu trúc may đo tỉ mỉ hòa cùng sự phá cách của phong cách đường phố.",
    tag: "03 / ATELIER",
  },
];

export const InteractiveTypographySection = () => {
  const [index, setIndex] = useState(0);
  const currentMsg = messages[index];
  const prefersReduced = usePrefersReducedMotion();

  const handleNextMessage = () => {
    setIndex((prev) => (prev + 1) % messages.length);
  };

  return (
    <section className="relative py-20 sm:py-28 bg-[#FBF9F5] overflow-hidden border-b border-[#062D22]/10 select-none">
      <div className="w-full px-2 sm:px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Left: Giant Animated Typography */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-[#062D22]/5 border border-[#062D22]/10 text-[10px] font-extrabold tracking-[0.25em] text-[#062D22] uppercase">
              <Sparkles size={12} className="text-[#062D22]" />
              <span>{currentMsg.tag} · BẢN TUYÊN NGÔN THƯƠNG HIỆU</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentMsg.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-3xl sm:text-5xl lg:text-6xl text-[#062D22] uppercase font-display font-black leading-[0.94] tracking-tight">
                  {currentMsg.title}
                </h2>
                <p className="mt-6 text-sm sm:text-base text-[#747974] max-w-xl font-medium leading-relaxed">
                  {currentMsg.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Interactive 2D Editorial Brand Emblem */}
          <div className="flex flex-col items-center justify-center">
            <motion.button
              type="button"
              onClick={handleNextMessage}
              whileHover={prefersReduced ? {} : { scale: 1.05 }}
              whileTap={prefersReduced ? {} : { scale: 0.95 }}
              className="relative w-44 h-44 rounded-full flex items-center justify-center p-3 bg-white shadow-[0_12px_40px_rgba(6,45,34,0.06)] border border-[#062D22]/10 transition-shadow duration-300 cursor-pointer group"
              aria-label="Nhấn để đổi thông điệp thương hiệu"
            >
              {/* Outer rotating decorative ring */}
              <div
                className={`absolute inset-2 rounded-full border border-dashed border-[#062D22]/20 ${
                  prefersReduced ? "" : "animate-[spin_24s_linear_infinite]"
                }`}
              />

              {/* Central Brand Seal */}
              <div className="w-24 h-24 rounded-full bg-[#062D22] text-[#F7F6F1] flex flex-col items-center justify-center p-2 text-center shadow-md group-hover:bg-[#F5DD20] group-hover:text-[#062D22] transition-colors duration-300">
                <Compass size={22} className="mb-1 text-[#F5DD20] group-hover:text-[#062D22] transition-colors" />
                <span className="text-[9px] font-black tracking-widest uppercase font-display leading-tight">
                  404 ATELIER
                </span>
                <span className="text-[8px] font-mono tracking-wider opacity-70">
                  EST. 2026
                </span>
              </div>

              {/* Floating interact pill */}
              <div className="absolute -bottom-2.5 px-3.5 py-1 rounded-full bg-[#062D22] text-[#F5DD20] text-[9px] font-extrabold tracking-widest uppercase flex items-center gap-1.5 shadow-md group-hover:bg-[#F5DD20] group-hover:text-[#062D22] transition-colors">
                <RefreshCw size={10} />
                <span>CHẠM ĐỔI Ý</span>
              </div>
            </motion.button>

            <span className="text-[11px] font-bold text-[#747974] tracking-widest uppercase mt-4">
              Nhấn con dấu để đổi thông điệp
            </span>
          </div>

        </div>
      </div>
    </section>
  );
};

export default InteractiveTypographySection;
