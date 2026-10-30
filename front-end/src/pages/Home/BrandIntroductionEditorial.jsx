import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import blazerImg from "./assets/product-navy-blazer.jpg";
import bagImg from "./assets/product-brown-bag.jpg";

export const BrandIntroductionEditorial = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-[#FBF9F5] overflow-hidden border-b border-[#062D22]/10 select-none">
      <div className="w-full px-2 sm:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left: Editorial Manifesto Typography */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#062D22]/5 border border-[#062D22]/10 text-[10px] font-extrabold tracking-[0.25em] text-[#062D22] uppercase">
              <Sparkles size={12} className="text-[#062D22]" />
              <span>THE ATELIER PHILOSOPHY</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl text-[#062D22] uppercase font-display font-black leading-[0.92] tracking-tight">
              WE SHAPE CLOTHES<br />
              <span className="text-[#062D22]/40 font-editorial italic lowercase text-[0.88em] pr-2">
                that move
              </span>
              WITH YOUR SPIRIT.
            </h2>

            <p className="text-sm sm:text-base text-[#747974] font-medium leading-relaxed max-w-xl">
              Tại 404Studio, chúng tôi không thiết kế chạy theo những xu hướng thoáng qua. Chúng tôi chú trọng cấu trúc hình học, chất liệu vải tự nhiên cao cấp và từng đường may đo chuẩn xác để tôn vinh bản sắc độc nhất của bạn.
            </p>

            <div className="pt-2 flex items-center gap-6">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#062D22] text-[#F7F6F1] font-display text-xs font-bold uppercase tracking-wider hover:bg-[#F5DD20] hover:text-[#062D22] transition-all shadow-md active:scale-95 group cursor-pointer"
              >
                <span>Đọc toàn bộ câu chuyện</span>
                <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right: Asymmetrical Collage Imagery */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md">
              {/* Primary large portrait */}
              <div className="rounded-3xl overflow-hidden shadow-2xl bg-[#EDE6DD] aspect-3/4">
                <img
                  src={blazerImg}
                  alt="Atelier Tailoring Craft"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>

              {/* Secondary overlapping float card */}
              <div className="absolute -bottom-8 -left-8 sm:-left-12 w-44 sm:w-56 rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                <div className="aspect-square">
                  <img
                    src={bagImg}
                    alt="Leather Goods"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 bg-white text-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#062D22]">
                    HANDCRAFTED FINISH
                  </span>
                </div>
              </div>

              {/* Decorative accent dot */}
              <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-[#DCE84A] text-[#062D22] flex items-center justify-center font-bold text-xs shadow-lg">
                ✦
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BrandIntroductionEditorial;
