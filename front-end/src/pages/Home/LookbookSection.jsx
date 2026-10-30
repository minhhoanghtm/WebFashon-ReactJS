import React, { useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { getLookbooksService } from "@/services/page.service";

import summerLookImage from "./assets/lookbook-summer.jpg";
import eveningLookImage from "./assets/lookbook-evening.jpg";

const fallbackLookbooks = [
  {
    _id: "lb-summer-resort",
    slug: "summer-resort-2026",
    title: "The Urban Minimalist",
    seoTitle: "Lookbook Mùa Mới",
    excerpt: "Sự kết hợp tinh tế giữa chất liệu Linen tự nhiên và phom dáng may đo phóng khoáng cho ngày hè đô thị năng động.",
    cover: summerLookImage,
  },
  {
    _id: "lb-evening-glam",
    slug: "evening-elegance-2026",
    title: "Evening Elegance",
    seoTitle: "Lookbook Dạ Tiệc",
    excerpt: "Nét quyến rũ vượt thời gian với chất liệu lụa cao cấp và đường cắt may chuẩn xác tôn vinh phong thái đỉnh cao.",
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

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-700"></div>
      </div>
    );
  }

  return (
    <section
      className="home-section home-lookbook mt-12"
      aria-labelledby="home-lookbook-title"
    >
      <SectionHeader
        id="home-lookbook-title"
        eyebrow="Cảm hứng mặc đẹp"
        title="Gợi ý phối đồ"
        subtitle="Lấy cảm hứng từ những bản phối thời trang được tuyển chọn bởi stylist chuyên nghiệp"
      />

      <div className="home-lookbook__grid mt-8">
        {displayLookbooks.map((item) => {
          const firstHero = item.sections?.find(
            (s) => s.type === "hero" || s.type === "banner" || s.type === "image_text"
          );
          const resolvedCover = item.cover || item.thumbnailUrl || item.bannerUrl || firstHero?.data?.coverImage || firstHero?.data?.image || "";

          return (
            <article
              className="home-lookbook-card group"
              key={item._id}
              style={resolvedCover ? {
                backgroundImage: `url("${encodeURI(resolvedCover)}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              } : {}}
            >
            <div className="home-lookbook-card__shade transition-opacity duration-300 group-hover:opacity-95" />
            <div className="home-lookbook-card__content select-none">
              <span className="text-[10px] font-extrabold tracking-[0.2em] text-amber-300 uppercase block mb-1.5">
                {item.seoTitle || "Lookbook Atelier"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white font-heading">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-200 mt-2 line-clamp-3 max-w-md">
                {item.excerpt}
              </p>
              <a 
                href={item.slug ? `/lookbooks/${item.slug}` : "/lookbooks"}
                className="inline-flex items-center gap-2 text-xs font-bold text-white mt-4 border-b border-white/60 pb-1 hover:border-white hover:gap-3 transition-all"
              >
                <span>Xem bộ sưu tập</span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
          </article>
        )})}
      </div>
    </section>
  );
};

export default LookbookSection;
