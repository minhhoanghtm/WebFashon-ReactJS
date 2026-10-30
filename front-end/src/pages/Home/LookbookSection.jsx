import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { getLookbooksService } from "@/services/page.service";
import AnimatedSection from "../../components/motion/AnimatedSection";
import ParallaxImage from "../../components/motion/ParallaxImage";
import { StaggerContainer, StaggerItem } from "../../components/motion/StaggerContainer";
import CursorEditorialLabel from "../../components/motion/CursorEditorialLabel";
import MagneticCTA from "../../components/motion/MagneticCTA";
import TextReveal from "../../components/motion/TextReveal";
import { motionEase } from "../../config/motionTokens";

import summerLookImage from "./assets/lookbook-summer.jpg";
import eveningLookImage from "./assets/lookbook-evening.jpg";

const MotionArticle = motion.article;
const MotionDiv = motion.div;

const fallbackLookbooks = [
  {
    _id: "lb-summer-resort",
    slug: "summer-resort-2026",
    title: "The Urban Minimalist",
    seoTitle: "Lookbook Mùa Mới",
    excerpt:
      "Sự kết hợp tinh tế giữa chất liệu Linen tự nhiên và phom dáng may đo phóng khoáng cho ngày hè đô thị năng động.",
    cover: summerLookImage,
  },
  {
    _id: "lb-evening-glam",
    slug: "evening-elegance-2026",
    title: "Evening Nocturne",
    seoTitle: "Lookbook Dạ Tiệc",
    excerpt:
      "Nét quyến rũ vượt thời gian với chất liệu lụa cao cấp và đường cắt may chuẩn xác tôn vinh phong thái đỉnh cao.",
    cover: eveningLookImage,
  },
];

const LookbookSection = () => {
  const [lookbooks, setLookbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLookbooks = async () => {
      try {
        const res = await getLookbooksService({ limit: 2 });
        const list = res.pages || res.data || [];
        setLookbooks(list);
      } catch (err) {
        console.error("Lỗi khi nạp Lookbooks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLookbooks();
  }, []);

  const displayLookbooks = lookbooks.length > 0 ? lookbooks : fallbackLookbooks;
  const primaryLook = displayLookbooks[0] || fallbackLookbooks[0];
  const secondaryLook = displayLookbooks[1] || fallbackLookbooks[1];

  const getCoverImage = (item) => {
    if (!item) return "";
    const firstHero = item.sections?.find(
      (s) => s.type === "hero" || s.type === "banner" || s.type === "image_text"
    );
    return (
      item.cover ||
      item.thumbnailUrl ||
      item.bannerUrl ||
      firstHero?.data?.coverImage ||
      firstHero?.data?.image ||
      ""
    );
  };

  const primaryCover = getCoverImage(primaryLook);
  const secondaryCover = getCoverImage(secondaryLook);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-700"></div>
      </div>
    );
  }

  return (
    <AnimatedSection
      variant="editorial"
      className="home-section home-lookbook mt-16 sm:mt-24"
      aria-labelledby="cinematic-lookbook-title"
    >
      {/* Cinematic Lookbook Stage Wrapper */}
      <div className="cinematic-lookbook-stage relative rounded-3xl p-6 sm:p-10 lg:p-14 overflow-hidden border border-white/10">
        {/* Soft Ambient Spotlight Glow */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-radial from-amber-600/10 via-amber-700/5 to-transparent blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* 1. EDITORIAL HEADER SECTION */}
        <div className="relative z-10 max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#F5DD20] animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#F5DD20]">
              CHAPTER 04 · THE VISUAL ESSAY
            </span>
            <span className="text-white/20 text-xs">/</span>
            <span className="text-white/40 text-[11px] font-mono tracking-wider">
              [ 404 ATELIER ]
            </span>
          </div>

          <TextReveal as="h2" className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-[1.08] font-serif">
            BEYOND THE ORDINARY.
          </TextReveal>

          <p className="mt-4 text-sm sm:text-base text-neutral-300 font-sans font-normal leading-relaxed max-w-xl">
            Những bản phối streetwear may đo thách thức ranh giới tối giản. Từng khung hình là một câu chuyện về bản ngã và tinh thần tự do của thế hệ mới.
          </p>
        </div>

        {/* 2. ASYMMETRIC EDITORIAL GRID */}
        <StaggerContainer
          staggerDelay={0.14}
          className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
        >
          {/* CỘT TRÁI (7 CỘT): LOOK 01 CHỦ ĐẠO - KHỔ LỚN */}
          <StaggerItem className="lg:col-span-7 flex flex-col">
            <CursorEditorialLabel label="LOOK 01 · VIEW STORY" className="h-full">
              <MotionArticle
                whileHover={{ y: -6, transition: { duration: 0.35, ease: motionEase.editorialReveal } }}
                className="group relative rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 flex flex-col justify-end min-h-[520px] sm:min-h-[620px] h-full shadow-2xl transition-all duration-500"
              >
                {/* Parallax Image */}
                {primaryCover ? (
                  <ParallaxImage
                    src={primaryCover}
                    alt={primaryLook.title}
                    speed={0.12}
                    containerClassName="absolute inset-0 w-full h-full"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                    className="w-full h-full object-cover object-[center_top] transition-transform duration-700 ease-out group-hover:scale-106"
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-800" />
                )}

                {/* Dark Vignette Overlay for Crisp Readability */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-500 group-hover:opacity-90 pointer-events-none"
                  aria-hidden="true"
                />

                {/* Scene Marker */}
                <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-extrabold tracking-[0.22em] text-white uppercase border border-white/15 shadow-sm">
                    SCENE 01 · URBAN SHADOWS
                  </span>
                </div>

                {/* Content Layer */}
                <div className="relative z-20 p-8 sm:p-12 text-left">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#F5DD20] block mb-2">
                    {primaryLook.seoTitle || "Summer Resort 2026"}
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-black text-white font-serif leading-tight drop-shadow-md">
                    {primaryLook.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 mt-3 line-clamp-3 max-w-lg font-medium leading-relaxed">
                    {primaryLook.excerpt}
                  </p>

                  <div className="pt-6">
                    <MagneticCTA strength={0.25} radius={65}>
                      <Link
                        to={primaryLook.slug ? `/lookbooks/${primaryLook.slug}` : "/lookbooks"}
                        className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-white border-b-2 border-[#F5DD20] pb-1.5 hover:gap-4 transition-all group/link"
                      >
                        <span>Khám phá bản phối này</span>
                        <ArrowUpRight
                          size={16}
                          className="text-[#F5DD20] transition-transform group-hover/link:translate-x-1 group-hover/link:-translate-y-1"
                        />
                      </Link>
                    </MagneticCTA>
                  </div>
                </div>
              </MotionArticle>
            </CursorEditorialLabel>
          </StaggerItem>

          {/* CỘT PHẢI (5 CỘT): MANIFESTO QUOTE + LOOK 02 OFFSET */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
            {/* Editorial Manifesto Quote Box */}
            <StaggerItem>
              <div className="p-7 sm:p-8 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 text-xs mb-3">
                  <span className="text-[10px] font-bold tracking-[0.25em] text-[#F5DD20] uppercase">
                    ATELIER MANIFESTO
                  </span>
                  <Sparkles size={14} className="text-[#F5DD20]" />
                </div>
                <p className="font-serif italic text-base sm:text-lg text-neutral-200 leading-relaxed my-2">
                  “Phong thái bắt đầu khi bạn dám từ bỏ những quy chuẩn rập khuôn. Thời trang streetwear may đo là tuyên ngôn không lời của cái tôi khác biệt.”
                </p>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400 font-mono tracking-wider">
                  <span>404STUDIO ATELIER</span>
                  <span>EST. 2026</span>
                </div>
              </div>
            </StaggerItem>

            {/* Look 02 Card */}
            <StaggerItem className="flex-1 flex flex-col">
              <CursorEditorialLabel label="LOOK 02 · VIEW STORY" className="h-full">
                <MotionArticle
                  whileHover={{ y: -6, transition: { duration: 0.35, ease: motionEase.editorialReveal } }}
                  className="group relative rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 flex flex-col justify-end min-h-[400px] sm:min-h-[460px] h-full shadow-2xl transition-all duration-500"
                >
                  {/* Parallax Image */}
                  {secondaryCover ? (
                    <ParallaxImage
                      src={secondaryCover}
                      alt={secondaryLook.title}
                      speed={0.1}
                      containerClassName="absolute inset-0 w-full h-full"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                      className="w-full h-full object-cover object-[center_top] transition-transform duration-700 ease-out group-hover:scale-106"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-800" />
                  )}

                  {/* Gradient Overlay */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-500 group-hover:opacity-90 pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Scene Marker */}
                  <div className="absolute top-5 left-5 z-20">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-extrabold tracking-[0.22em] text-white uppercase border border-white/15">
                      SCENE 02 · NOCTURNE SILK
                    </span>
                  </div>

                  {/* Content */}
                  <div className="relative z-20 p-7 sm:p-9 text-left">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F5DD20] block mb-1.5">
                      {secondaryLook.seoTitle || "Evening Edition"}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white font-serif leading-tight">
                      {secondaryLook.title}
                    </h3>
                    <p className="text-xs text-neutral-300 mt-2 line-clamp-2 max-w-sm font-medium">
                      {secondaryLook.excerpt}
                    </p>

                    <div className="pt-4">
                      <MagneticCTA strength={0.25} radius={50}>
                        <Link
                          to={secondaryLook.slug ? `/lookbooks/${secondaryLook.slug}` : "/lookbooks"}
                          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white border-b border-[#F5DD20] pb-1 hover:gap-3 transition-all group/link"
                        >
                          <span>Xem chi tiết look</span>
                          <ArrowUpRight
                            size={14}
                            className="text-[#F5DD20] transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
                          />
                        </Link>
                      </MagneticCTA>
                    </div>
                  </div>
                </MotionArticle>
              </CursorEditorialLabel>
            </StaggerItem>
          </div>
        </StaggerContainer>

        {/* 3. SECTION-WIDE CTA BANNER */}
        <div className="relative z-10 mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-neutral-400 font-mono tracking-wider text-center sm:text-left">
            Tất cả các bản phối đều kèm danh sách sản phẩm tương thích trực tiếp.
          </div>
          <MagneticCTA strength={0.3} radius={70}>
            <Link
              to="/lookbooks"
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-white text-neutral-950 hover:bg-neutral-200 font-bold text-xs uppercase tracking-widest shadow-xl transition-all duration-300 cursor-pointer"
            >
              <span>Xem toàn bộ Lookbook Archive</span>
              <ArrowUpRight size={16} />
            </Link>
          </MagneticCTA>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default LookbookSection;
