import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";

export function FaqAccordionSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "Làm sao để chọn đúng kích cỡ trang phục may đo chuẩn xác?",
      a: "Chúng tôi cung cấp hai công cụ hỗ trợ: Bảng thông số đo chi tiết (ngực, eo, mông, chiều dài lưng) tại trang 'Hướng Dẫn Chọn Size', và tính năng Trợ lý AI Smart Size Assistant ngay trên từng trang sản phẩm. Bạn chỉ cần nhập chiều cao, cân nặng và dáng người, hệ thống sẽ đề xuất size tối ưu với độ chính xác trên 95%.",
      link: "/guide",
      linkText: "Xem bảng kích thước chuẩn",
    },
    {
      q: "Thời gian và chính sách giao hàng của Atelier như thế nào?",
      a: "Mọi đơn hàng từ 1.000.000 ₫ đều được miễn phí vận chuyển hỏa tốc toàn quốc. Thời gian giao hàng tiêu chuẩn là 24h đối với khu vực nội thành Hà Nội & TP. Hồ Chí Minh, và 2-3 ngày làm việc đối với các tỉnh thành khác. Mỗi kiện hàng đều được đóng gói trong hộp đen Atelier chống sốc sang trọng.",
      link: "/shipping",
      linkText: "Chi tiết biểu phí giao nhận",
    },
    {
      q: "Chính sách đổi trả sản phẩm may đo áp dụng ra sao?",
      a: "Atelier hỗ trợ đổi size hoặc đổi mẫu miễn phí tận nhà trong vòng 07 ngày kể từ khi nhận hàng đối với sản phẩm còn nguyên tem mác, chưa qua giặt ủi. Nếu sản phẩm phát sinh lỗi đường chỉ hoặc chất liệu từ nhà sản xuất, chúng tôi cam kết hoàn tiền 100% hoặc may lại sản phẩm mới.",
      link: "/returns-refunds",
      linkText: "Xem chính sách đổi trả 7 ngày",
    },
    {
      q: "Nguồn gốc sợi dệt và chất liệu vải của WebFashion có gì khác biệt?",
      a: "100% chất liệu vải của Atelier (như Wool Crepe, Mulberry Silk, Egyptian Cotton) đều được nhập khẩu chọn lọc từ các nhà dệt lâu đời tại Ý và Nhật Bản, đạt chứng chỉ Oeko-Tex Standard 100 và tiêu chuẩn may đo cao cấp, đảm bảo thoáng mát và bền phom sau nhiều lần giặt.",
      link: "/about",
      linkText: "Tìm hiểu di sản chất liệu Atelier",
    },
  ];

  return (
    <section className="py-16 sm:py-24 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full border-b border-[rgba(244,240,232,0.1)]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Heading & Concierge Callout */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block">
              HỖ TRỢ MUA SẮM TRỰC TUYẾN
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f0e8]">
              SHOPPING CONCIERGE & FAQ
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#9a989f] leading-relaxed">
            Mọi thắc mắc của bạn về dịch vụ may đo, quy trình chọn size và chính sách đổi trả đều được đội ngũ chăm sóc khách hàng Atelier tận tình giải đáp.
          </p>

          <div className="p-5 bg-[#161619] border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-display uppercase tracking-wider text-[#f4f0e8] font-bold">
              <HelpCircle size={15} className="text-[#e65100]" />
              <span>Cần Tư Vấn May Đo Trực Tiếp?</span>
            </div>
            <p className="text-xs text-[#9a989f]">
              Đội ngũ tư vấn viên của Atelier luôn sẵn sàng hỗ trợ qua hotline hoặc chat trực tuyến 24/7.
            </p>
            <div className="pt-1">
              <Link to="/contact-legal" className="text-xs font-mono text-[#ff6d00] hover:underline">
                Hotline: 1900 6868 (8:00 - 22:00)
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Accordion List */}
        <div className="lg:col-span-7 space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#161619] border border-[rgba(244,240,232,0.1)] transition-colors overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 text-sm font-display uppercase tracking-wider text-[#f4f0e8] hover:text-[#ff6d00] transition-colors"
                >
                  <span className="font-bold">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-[#e65100] transition-transform duration-300 shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-white/5 space-y-3 animate-fade-in">
                    <p className="text-xs text-[#9a989f] leading-relaxed">
                      {faq.a}
                    </p>
                    <Link
                      to={faq.link}
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-[#e65100] hover:text-[#ff6d00] transition-colors"
                    >
                      <span>{faq.linkText}</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
