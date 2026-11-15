import React from "react";
import { Star, ShieldCheck, Quote } from "lucide-react";
import { SafeImage } from "../ui/SafeImage";

export function CustomerReviewsSection() {
  const reviews = [
    {
      id: "rev-1",
      author: "Hoàng Nam",
      role: "Doanh nhân & Nhà sáng lập",
      city: "Hà Nội",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
      product: "Áo Blazer Len Ý Cấu Trúc",
      rating: 5,
      content:
        "Đường may của chiếc Wool Blazer thực sự ở đẳng cấp Haute Couture. Phom dáng đứng và tôn vai rất tốt nhưng mặc cả ngày vẫn nhẹ nhàng, không hề gò bó. Đây là chiếc blazer ưng ý nhất trong tủ đồ của tôi.",
      date: "Tháng 10/2026",
    },
    {
      id: "rev-2",
      author: "Minh Thư",
      role: "Kiến trúc sư nội thất",
      city: "TP. Hồ Chí Minh",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
      product: "Quần Tây Xếp Ly Đôi Form Rộng",
      rating: 5,
      content:
        "Tôi yêu thích tính tối giản trong cấu trúc thiết kế. Chất vải len pha lụa sờ vào rất đầm tay, có độ rũ tự nhiên tuyệt đẹp và hầu như không bị nhăn sau ngày dài di chuyển giữa các công trình.",
      date: "Tháng 11/2026",
    },
    {
      id: "rev-3",
      author: "Đức Anh",
      role: "Creative Director",
      city: "Đà Nẵng",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
      product: "Trọn Bộ Complete The Look #02",
      rating: 5,
      content:
        "Trợ lý AI tư vấn size rất chuẩn xác so với số đo của tôi. Mua nguyên set 3 món được giảm 10% phối đồ ăn ý ngay mà không mất công đắn đo mỗi sáng. Dịch vụ đóng gói hộp đen Atelier cực kỳ chỉn chu.",
      date: "Tháng 11/2026",
    },
  ];

  return (
    <section className="py-16 sm:py-24 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full border-b border-[rgba(244,240,232,0.1)]">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-[rgba(244,240,232,0.1)]">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block mb-1">
            TRẢI NGHIỆM THỰC TẾ
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f0e8]">
            VOICES OF ATELIER
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#9a989f]">
          <span className="text-[#ff6d00] font-bold text-base">4.9 / 5.0</span>
          <span>Dựa trên 1,280+ khách hàng may đo xác thực</span>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-6 bg-[#161619] border border-[rgba(244,240,232,0.1)] flex flex-col justify-between space-y-6 hover:border-[#e65100]/40 transition-colors"
          >
            <div className="space-y-4">
              {/* Star Rating & Verified Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[#ff6d00]">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} size={14} fill="#ff6d00" />
                  ))}
                </div>
                <div className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 border border-emerald-800/40">
                  <ShieldCheck size={11} />
                  <span>ĐÃ MUA HÀNG</span>
                </div>
              </div>

              {/* Quote Text */}
              <p className="text-xs sm:text-sm text-[#f4f0e8] leading-relaxed italic">
                "{rev.content}"
              </p>
            </div>

            {/* Author Profile Footer */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#202025] shrink-0 border border-white/10">
                  <SafeImage src={rev.avatar} alt={rev.author} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display text-xs font-bold text-[#f4f0e8] truncate">
                    {rev.author}
                  </h4>
                  <p className="text-[10px] text-[#9a989f] truncate">
                    {rev.role} • {rev.city}
                  </p>
                </div>
              </div>

              <div className="text-[10px] font-mono text-[#9a989f] bg-[#0c0c0e] px-2.5 py-1 border border-white/5 truncate">
                Đã mua: <span className="text-[#f4f0e8]">{rev.product}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
