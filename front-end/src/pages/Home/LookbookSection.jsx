import React, { useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { getLookbooksService } from "@/services/page.service";

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

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-650"></div>
      </div>
    );
  }

  if (lookbooks.length === 0) {
    return null;
  }

  return (
    <section
      className="home-section home-lookbook"
      aria-labelledby="home-lookbook-title"
    >
      <SectionHeader
        id="home-lookbook-title"
        eyebrow="Cảm hứng mặc đẹp"
        title="Gợi ý phối đồ"
        subtitle="Lấy cảm hứng từ những bộ sưu tập được chọn lọc"
      />

      <div className="home-lookbook__grid">
        {lookbooks.map((item) => {
          const firstHero = item.sections?.find(
            (s) => s.type === "hero" || s.type === "banner" || s.type === "image_text"
          );
          const resolvedCover = item.thumbnailUrl || item.bannerUrl || firstHero?.data?.coverImage || firstHero?.data?.image || "";

          return (
            <article
              className="home-lookbook-card"
              key={item._id}
              style={resolvedCover ? {
                backgroundImage: `url("${encodeURI(resolvedCover)}")`,
              } : {}}
            >
            <div className="home-lookbook-card__shade" />
            <div className="home-lookbook-card__content">
              <span>{item.seoTitle || "Lookbook"}</span>
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>
              <a href={`/lookbooks/${item.slug}`}>
                Xem thêm
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            </div>
          </article>
        )})}
      </div>
    </section>
  );
};

export default LookbookSection;
