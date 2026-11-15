import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { SafeImage } from "../ui/SafeImage";

export function CampaignEditorialBanner() {
  return (
    <section className="relative w-full border-b border-[rgba(244,240,232,0.1)] overflow-hidden bg-[#0c0c0e]">
      {/* Background Editorial Image */}
      <div className="absolute inset-0 w-full h-full">
        <SafeImage
          src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1600&q=80"
          alt="Chiến dịch The Monochrome Archive"
          className="w-full h-full object-cover grayscale-[30%] opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c0e] via-[#0c0c0e]/80 to-[#0c0c0e]/60" />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[rgba(244,240,232,0.06)] border border-white/10 text-xs font-mono uppercase tracking-widest text-[#f4f0e8]">
            <Sparkles size={13} className="text-[#e65100]" />
            <span>CHIẾN DỊCH CHỦ ĐẠO MÙA MỚI — EDITION 04</span>
          </div>

          <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-[#f4f0e8] leading-[1.05]">
            THE MONOCHROME <br />
            <span className="text-[#e65100]">ARCHIVE CAPSULE</span>
          </h2>

          <p className="text-sm sm:text-base text-[#9a989f] max-w-xl leading-relaxed">
            Khai phá chiều sâu của gam màu đen Obsidian, than chì và be tro qua những cấu trúc may đo phá cách. Mỗi sản phẩm được phát hành với số lượng giới hạn nhằm bảo toàn tính độc bản.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link to="/products?category=capsule">
              <Button variant="signal" size="lg" className="gap-2">
                <span>Mua Bộ Sưu Tập Capsule</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/lookbooks">
              <Button variant="secondary" size="lg">
                Xem Fashion Lookbook
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Editorial Stamp / Stats */}
        <div className="lg:col-span-4 hidden lg:flex flex-col justify-end items-end text-right space-y-3 font-mono text-xs text-[#9a989f]">
          <div className="p-4 bg-[#121215]/90 border border-white/10 max-w-xs text-left">
            <span className="text-[10px] tracking-widest text-[#e65100] uppercase block mb-1">
              CHI TIẾT PHÁT HÀNH
            </span>
            <p className="text-xs text-[#f4f0e8] font-semibold">
              Phiên bản số 04: Cấu trúc may đo tối giản với sợi Wool Crepe dệt tại Biella, Ý.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
