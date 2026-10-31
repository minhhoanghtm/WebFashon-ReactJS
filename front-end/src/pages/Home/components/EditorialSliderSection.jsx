import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { getLookbooksService } from "@/services/page.service";
import { formatDate } from "@/utils/format";
import HOME_CONTENT from "../content";

export const EditorialSliderSection = () => {
  const [items, setItems] = useState([]);
  const [startIndex, setStartIndex] = useState(0);

  const { editorialNews } = HOME_CONTENT;

  // Fetch real lookbook articles from API
  useEffect(() => {
    let isMounted = true;
    const fetchArticles = async () => {
      try {
        const res = await getLookbooksService({ limit: 6 });
        const list = res.pages || res.data || [];
        if (!isMounted || !Array.isArray(list) || list.length === 0) return;

        const mapped = list.map((item, idx) => ({
          id: item._id || item.id || `edit-${idx}`,
          title: item.title || `ẤN BẢN ATELIER 0${idx + 1}`,
          category: item.category || "LOOKBOOK",
          date: item.createdAt || item.updatedAt || new Date().toISOString(),
          excerpt: item.excerpt || "Khám phá quy trình nghiên cứu phom dáng và chất liệu.",
          imageUrl: item.cover || item.thumbnail || item.image || "",
          code: `ISSUE-0${idx + 1}`,
        }));

        if (mapped.length > 0) {
          setItems(mapped);
        }
      } catch {
        // Fallback to structural placeholders
      }
    };

    fetchArticles();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayArticles = useMemo(() => {
    return items.length >= 3
      ? items
      : [
          {
            id: "article-1",
            title: "CẤU TRÚC MAY ĐO VÀ KHÔNG GIAN ĐÔ THỊ",
            category: "NGHIÊN CỨU",
            date: new Date().toISOString(),
            excerpt: "Sự gặp gỡ giữa đường thẳng kiến trúc và nét mềm mại của sợi tự nhiên.",
            imageUrl: "",
            code: "ISSUE-01",
          },
          {
            id: "article-2",
            title: "KỸ NGHỆ HOÀN THIỆN ĐƠN CHIẾC",
            category: "ATELIER",
            date: new Date().toISOString(),
            excerpt: "Tìm hiểu quy trình cắt may thủ công từng sản phẩm tại xưởng thiết kế.",
            imageUrl: "",
            code: "ISSUE-02",
          },
          {
            id: "article-3",
            title: "SỰ TIẾT CHẾ CỦA MÀU SẮC ĐƠN TÍNH",
            category: "TRIẾT LÝ",
            date: new Date().toISOString(),
            excerpt: "Tại sao sắc đen, trắng và ghi xám lại mang lại sức mạnh biểu đạt bền vững.",
            imageUrl: "",
            code: "ISSUE-03",
          },
        ];
  }, [items]);

  const visibleArticles = displayArticles.slice(startIndex, startIndex + 3);

  const handlePrev = () => {
    setStartIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleNext = () => {
    setStartIndex((prev) =>
      prev + 3 < displayArticles.length ? prev + 1 : prev
    );
  };

  return (
    <section
      aria-labelledby="editorial-section-heading"
      className="relative z-10 bg-white text-[#05251C] px-4 py-20 sm:px-8 sm:py-32 lg:px-14 border-t border-[#05251C]/10"
    >
      <div className="mx-auto max-w-[1600px]">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-[#05251C]/10 pb-8 md:flex-row md:items-end">
          <div>
            <span className="font-mono text-xs tracking-[0.28em] uppercase text-[#05251C]/60">
              {editorialNews.eyebrow}
            </span>
            <h2
              id="editorial-section-heading"
              className="mt-2 font-condensed text-4xl sm:text-6xl font-bold uppercase tracking-tight text-[#05251C] leading-none"
            >
              {editorialNews.title}
            </h2>
            <p className="mt-3 max-w-xl font-sans text-xs sm:text-sm text-[#05251C]/75 leading-relaxed">
              {editorialNews.description}
            </p>
          </div>

          {/* Slider Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={startIndex === 0}
              onClick={handlePrev}
              aria-label="Xem bài viết trước"
              className="flex h-10 w-10 items-center justify-center border border-[#05251C]/20 text-[#05251C] transition-colors hover:border-[#05251C] hover:bg-[#05251C] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={startIndex + 3 >= displayArticles.length}
              onClick={handleNext}
              aria-label="Xem bài viết tiếp theo"
              className="flex h-10 w-10 items-center justify-center border border-[#05251C]/20 text-[#05251C] transition-colors hover:border-[#05251C] hover:bg-[#05251C] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 3 Vertical Columns Slider / Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {visibleArticles.map((article) => (
            <Link
              key={article.id}
              to="/products"
              className="group flex flex-col space-y-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#05251C]"
            >
              {/* 3:4 Vertical Image Canvas */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 border border-[#05251C]/10 shadow-xs">
                {article.imageUrl ? (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-b from-neutral-100 via-neutral-200 to-neutral-300 p-6 flex flex-col justify-between">
                    <span className="font-mono text-[9px] text-[#05251C]/40 tracking-widest uppercase">
                      {article.code}
                    </span>
                    <div className="text-center space-y-1">
                      <span className="font-condensed text-2xl font-bold uppercase text-[#05251C]/75 block">
                        {article.title}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-[#05251C]/30 text-right uppercase">
                      ATELIER EDIT
                    </span>
                  </div>
                )}
              </div>

              {/* Metadata: Date + Category */}
              <div className="flex items-center gap-3 font-mono text-[11px] text-[#05251C]/60 pt-1">
                <span>{formatDate(article.date)}</span>
                <span>/</span>
                <span className="font-semibold uppercase text-[#05251C]">
                  {article.category}
                </span>
              </div>

              {/* Title & Short description */}
              <div className="space-y-1">
                <h3 className="font-condensed text-2xl font-bold uppercase tracking-tight text-[#05251C] transition-colors group-hover:text-[#05251C]/70">
                  {article.title}
                </h3>
                <p className="font-sans text-xs text-[#05251C]/70 leading-relaxed line-clamp-2">
                  {article.excerpt}
                </p>
              </div>

              {/* Read indicator */}
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[#05251C] group-hover:underline pt-1">
                <span>KHÁM PHÁ</span>
                <ArrowUpRight size={13} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EditorialSliderSection;
