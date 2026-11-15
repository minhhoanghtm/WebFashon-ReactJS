import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Scissors, Sparkles, Award, ShieldCheck } from "lucide-react";
import { Button } from "../ui/Button";
import { SafeImage } from "../ui/SafeImage";

export function BrandStorySection() {
  return (
    <section className="py-20 sm:py-28 bg-[#0e0e11] border-b border-[rgba(244,240,232,0.1)] relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Visual: Atelier Crafting Collage */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] bg-[#161619] border border-[rgba(244,240,232,0.15)] overflow-hidden shadow-2xl">
              <SafeImage
                src="https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=1000&q=80"
                alt="Nghệ thuật may đo Atelier"
                className="w-full h-full object-cover grayscale-[25%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e]/80 via-transparent to-transparent" />

              {/* Floating Quality Seal */}
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-[#121215]/95 backdrop-blur-md border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#e65100]/20 border border-[#e65100] flex items-center justify-center text-[#ff6d00] shrink-0">
                  <Scissors size={20} />
                </div>
                <div>
                  <h4 className="font-display text-xs uppercase tracking-wider text-[#f4f0e8] font-bold">
                    ATELIER HANDMADE BENCHMARK
                  </h4>
                  <p className="text-[11px] text-[#9a989f]">
                    Được may đo thủ công bởi các nghệ nhân với hơn 15 năm kinh nghiệm.
                  </p>
                </div>
              </div>
            </div>

            {/* Geometric Accent Border */}
            <div className="hidden sm:block absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-[#e65100]/40 -z-10" />
            <div className="hidden sm:block absolute -bottom-4 -right-4 w-24 h-24 border-b-2 border-r-2 border-[#e65100]/40 -z-10" />
          </div>

          {/* Right Content: Manifesto & Craftsmanship Stats */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#e65100] uppercase">
                <Sparkles size={14} />
                <span>BẢN SẮC & DI SẢN THƯƠNG HIỆU</span>
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#f4f0e8] leading-[1.1]">
                CẤU TRÚC MAY ĐO <br />
                <span className="text-[#e65100]">KHÔNG THỜI HẠN</span>
              </h2>
            </div>

            <p className="text-sm sm:text-base text-[#9a989f] leading-relaxed">
              Tại WebFashion Atelier, chúng tôi tin rằng trang phục không chạy theo những vòng xoay xu hướng ngắn hạn. Thay vào đó, mỗi đường kim mũi chỉ được định hình dựa trên kiến trúc giải phẫu học cơ thể, mang lại phom dáng chuẩn mực, uyển chuyển và bền vững theo thời gian.
            </p>

            {/* 3 Metric Badges */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-y border-[rgba(244,240,232,0.1)] py-6">
              <div>
                <span className="font-display text-2xl sm:text-3xl font-bold text-[#f4f0e8] block">
                  240<span className="text-[#e65100]">+</span>
                </span>
                <span className="text-[10px] sm:text-xs font-mono uppercase text-[#9a989f] tracking-wider">
                  Giờ May Đo / BST
                </span>
              </div>
              <div>
                <span className="font-display text-2xl sm:text-3xl font-bold text-[#f4f0e8] block">
                  100<span className="text-[#e65100]">%</span>
                </span>
                <span className="text-[10px] sm:text-xs font-mono uppercase text-[#9a989f] tracking-wider">
                  Sợi Dệt Tự Nhiên
                </span>
              </div>
              <div>
                <span className="font-display text-2xl sm:text-3xl font-bold text-[#f4f0e8] block">
                  15<span className="text-[#e65100]">Năm</span>
                </span>
                <span className="text-[10px] sm:text-xs font-mono uppercase text-[#9a989f] tracking-wider">
                  Kinh Nghiệm Nghệ Nhân
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/about">
                <Button variant="signal" size="md" className="gap-2">
                  <span>Tìm Hiểu Câu Chuyện Atelier</span>
                  <ArrowRight size={14} />
                </Button>
              </Link>
              <Link to="/policy">
                <Button variant="secondary" size="md">
                  Tiêu Chuẩn May Đo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
