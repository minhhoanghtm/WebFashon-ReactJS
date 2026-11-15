import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, BookOpen } from "lucide-react";
import { SafeImage } from "../ui/SafeImage";

export function FashionJournalSection() {
  const articles = [
    {
      id: "art-1",
      title: "Nghệ Thuật Bảo Quản Len Merino & Lụa Tự Nhiên Chuẩn May Đo",
      category: "CHĂM SÓC TRANG PHỤC",
      readTime: "5 phút đọc",
      date: "12/11/2026",
      excerpt:
        "Hướng dẫn chi tiết từ chuyên gia Atelier về cách giặt hấp, bảo dưỡng sợi len cao cấp và giữ phom dáng áo blazer luôn đứng form nguyên bản qua nhiều mùa.",
      image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80",
    },
    {
      id: "art-2",
      title: "Cấu Trúc Đơn Sắc: Xu Hướng Thống Trị Thời Trang Đương Đại 2026/27",
      category: "XU HƯỚNG",
      readTime: "4 phút đọc",
      date: "08/11/2026",
      excerpt:
        "Tại sao bảng màu đen Obsidian, xám than chì và be tro tiếp tục là tuyên ngôn tối thượng của phong cách Quiet Luxury trong mùa thời trang năm nay.",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80",
    },
    {
      id: "art-3",
      title: "Quy Tắc May Đo Sartorial Cho Thế Hệ Lãnh Đạo Trẻ",
      category: "CẨM NANG PHONG CÁCH",
      readTime: "6 phút đọc",
      date: "01/11/2026",
      excerpt:
        "Giải mã tỷ lệ ve áo, độ dài ống quần và sự kết hợp giữa phom dáng truyền thống với phong cách hiện đại giúp nâng tầm thần thái quý ông công sở.",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80",
    },
  ];

  return (
    <section className="py-16 sm:py-24 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full border-b border-[rgba(244,240,232,0.1)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-[rgba(244,240,232,0.1)]">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block mb-1">
            GÓC NHÌN & KIẾN THỨC MAY ĐO
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f0e8]">
            ATELIER FASHION JOURNAL
          </h2>
        </div>
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-display tracking-widest text-[#9a989f] hover:text-[#e65100] uppercase transition-colors"
        >
          <span>Xem Tất Cả Bài Viết</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((art) => (
          <article
            key={art.id}
            className="group bg-[#161619] border border-[rgba(244,240,232,0.1)] hover:border-[#e65100]/60 overflow-hidden flex flex-col justify-between transition-all"
          >
            <div>
              {/* Image Thumbnail */}
              <div className="aspect-[16/10] w-full overflow-hidden relative">
                <SafeImage
                  src={art.image}
                  alt={art.title}
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161619] via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-2 py-0.5 bg-[#0c0c0e]/85 border border-white/10 text-[9px] font-mono uppercase tracking-widest text-[#ff6d00]">
                  {art.category}
                </span>
              </div>

              {/* Text Body */}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-[11px] font-mono text-[#9a989f]">
                  <span>{art.date}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{art.readTime}</span>
                  </div>
                </div>

                <h3 className="font-display text-lg font-bold text-[#f4f0e8] group-hover:text-[#ff6d00] transition-colors leading-snug">
                  <Link to="/blog">{art.title}</Link>
                </h3>

                <p className="text-xs text-[#9a989f] leading-relaxed line-clamp-3">
                  {art.excerpt}
                </p>
              </div>
            </div>

            {/* Read CTA */}
            <div className="p-6 pt-0">
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 text-xs font-display uppercase tracking-wider text-[#e65100] group-hover:text-[#ff6d00] transition-colors"
              >
                <span>Đọc Tiếp Bài Viết</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
