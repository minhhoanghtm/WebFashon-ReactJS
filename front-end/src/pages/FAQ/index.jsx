import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getPageBySlugService } from "@/services/page.service";
import { ChevronDown, Search, Sparkles, HelpCircle, Package, RefreshCw, ShieldCheck, PhoneCall } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import HeroSection from "@/components/page-sections/HeroSection";
import StorySection from "@/components/page-sections/StorySection";
import GallerySection from "@/components/page-sections/GallerySection";
import QuoteSection from "@/components/page-sections/QuoteSection";
import ImageTextSection from "@/components/page-sections/ImageTextSection";
import ProductsSection from "@/components/page-sections/ProductsSection";
import BannerSection from "@/components/page-sections/BannerSection";
import CTASection from "@/components/page-sections/CTASection";

const defaultFaqCategories = [
  {
    id: "orders",
    title: "Đơn hàng & Giao nhận",
    icon: Package,
    items: [
      {
        q: "Thời gian xử lý và giao hàng tiêu chuẩn là bao lâu?",
        a: "Với các đơn hàng nội thành Hà Nội và TP. Hồ Chí Minh, thời gian nhận hàng từ 1-2 ngày làm việc. Các tỉnh thành khác từ 2-4 ngày làm việc. Quý khách có thể theo dõi tiến trình đơn qua mã vận đơn trong trang 'Đơn hàng của tôi'.",
      },
      {
        q: "Tôi có được kiểm tra sản phẩm trước khi thanh toán không?",
        a: "Có. 404Studio hỗ trợ hình thức đồng kiểm khi nhận hàng. Quý khách có thể kiểm tra phom dáng, màu sắc và chất liệu sản phẩm trước khi thanh toán cho nhân viên giao hàng.",
      },
      {
        q: "Chính sách miễn phí vận chuyển áp dụng như thế nào?",
        a: "Chúng tôi miễn phí vận chuyển tiêu chuẩn toàn quốc cho tất cả các đơn hàng có giá trị thanh toán từ 500.000₫ trở lên.",
      },
    ],
  },
  {
    id: "returns",
    title: "Đổi trả & Hoàn tiền",
    icon: RefreshCw,
    items: [
      {
        q: "Quy định đổi trả hàng trong bao nhiêu ngày?",
        a: "Quý khách được đổi sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng thành công đối với trường hợp chọn nhầm size, đổi màu hoặc sản phẩm có lỗi kỹ thuật từ nhà sản xuất. Sản phẩm cần còn nguyên tem mác, chưa qua giặt ủi.",
      },
      {
        q: "Quy trình hoàn tiền cho đơn thanh toán online?",
        a: "Đối với các đơn thanh toán qua VNPay hoặc thẻ ngân hàng, số tiền hoàn trả sẽ được chuyển trực tiếp vào tài khoản ngân hàng của quý khách trong vòng 3-5 ngày làm việc sau khi xưởng tiếp nhận sản phẩm đổi trả.",
      },
    ],
  },
  {
    id: "care",
    title: "Chăm sóc trang phục & Size",
    icon: ShieldCheck,
    items: [
      {
        q: "Cách giặt ủi trang phục vải Linen và Blazer may đo?",
        a: "Trang phục chất liệu Linen nên được giặt tay hoặc giặt máy ở chế độ nhẹ nhàng với nước lạnh. Tuyệt đối không vắt xoắn mạnh. Áo blazer may đo cấu trúc nên được giặt khô (dry clean) định kỳ để giữ phom dáng ve áo sắc nét.",
      },
      {
        q: "Làm thế nào để chọn đúng size chuẩn cơ thể?",
        a: "Quý khách vui lòng tham khảo trang 'Hướng dẫn chọn size' với các số đo chi tiết về vòng ngực, vòng eo và chiều dài áo. Nếu cần tư vấn thêm, đội ngũ stylist của chúng tôi luôn sẵn sàng hỗ trợ qua khung chat trực tuyến.",
      },
    ],
  },
];

export const FAQ = () => {
  useDocumentTitle("Câu hỏi thường gặp — 404STUDIO");
  const [pageSections, setPageSections] = useState([]);
  const [contentHtml, setContentHtml] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAccordion, setActiveAccordion] = useState({});

  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        const data = await getPageBySlugService("faq").catch(() => null);
        const page = data?.page || data;
        const sections = data?.sections || data?.page?.sections || [];
        if (page?.content) setContentHtml(page.content);
        if (sections && sections.length > 0) setPageSections(sections);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu FAQ:", err);
      }
    };
    fetchFAQ();
  }, []);

  const toggleItem = (catId, itemIdx) => {
    const key = `${catId}-${itemIdx}`;
    setActiveAccordion((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const filteredCategories = defaultFaqCategories.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#05251C] py-12 sm:py-20 select-none">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb & Eyebrow */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#05251C]/5 border border-[#05251C]/10 text-[10px] font-black tracking-[0.25em] text-[#05251C] uppercase mb-4">
            <Sparkles size={12} className="text-[#05251C]" />
            <span>CENTRAL HELP DESK & SUPPORT</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#05251C] uppercase font-display leading-[0.92] tracking-tighter">
            CÂU HỎI THƯỜNG GẶP.
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-[#6B716E] max-w-lg mx-auto leading-relaxed">
            Mọi thông tin cần thiết về đơn hàng, vận chuyển, đổi trả và bảo quản sản phẩm tại xưởng may 404Studio.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B716E]" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm câu hỏi (giao hàng, đổi size, hoàn tiền...)"
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-[#05251C]/15 text-xs text-[#05251C] placeholder:text-[#6B716E]/50 outline-none focus:border-[#05251C] shadow-xs transition-colors"
            />
          </div>
        </div>

        {/* Dynamic CMS Sections if populated */}
        {pageSections && pageSections.length > 0 && (
          <div className="w-full mb-12">
            {[...pageSections]
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((section) => {
                switch (section.type) {
                  case "hero": return <HeroSection key={section._id || section.order} data={section.data} />;
                  case "story": return <StorySection key={section._id || section.order} data={section.data} />;
                  case "gallery": return <GallerySection key={section._id || section.order} data={section.data} />;
                  case "quote": return <QuoteSection key={section._id || section.order} data={section.data} />;
                  case "image_text": return <ImageTextSection key={section._id || section.order} data={section.data} />;
                  case "products": return <ProductsSection key={section._id || section.order} data={section.data} />;
                  case "banner": return <BannerSection key={section._id || section.order} data={section.data} />;
                  case "cta": return <CTASection key={section._id || section.order} data={section.data} />;
                  default: return null;
                }
              })}
          </div>
        )}

        {/* Accordions Category Group */}
        <div className="space-y-10">
          {filteredCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.id} className="bg-white rounded-3xl border border-[#05251C]/10 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#05251C]/10">
                  <div className="w-9 h-9 rounded-xl bg-[#05251C] text-[#F5DD20] flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-[#05251C] uppercase tracking-tight">
                    {cat.title}
                  </h2>
                </div>

                <div className="space-y-3">
                  {cat.items.map((item, idx) => {
                    const isOpen = Boolean(activeAccordion[`${cat.id}-${idx}`]);
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-[#05251C]/10 overflow-hidden bg-white/80 transition-colors shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(cat.id, idx)}
                          className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-100/80 transition-colors"
                        >
                          <span className="text-xs sm:text-sm font-bold text-[#05251C] leading-snug">
                            {item.q}
                          </span>
                          <ChevronDown
                            size={18}
                            className={`text-[#05251C] shrink-0 transition-transform duration-300 ${
                              isOpen ? "rotate-180 text-[#05251C]" : ""
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-[#6B716E] leading-relaxed border-t border-[#05251C]/5 pt-3">
                                {item.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Support Help Banner */}
        <div className="mt-14 rounded-3xl bg-[#05251C] text-white p-8 text-center sm:flex sm:items-center sm:justify-between sm:text-left gap-6">
          <div>
            <h3 className="text-xl font-black font-display text-[#F1D8CA] uppercase">
              VẪN CẦN THÊM SỰ HỖ TRỢ?
            </h3>
            <p className="text-xs text-[#D1D9CF] mt-1 max-w-md">
              Đội ngũ tư vấn viên của chúng tôi luôn trực tuyến để giải đáp mọi thắc mắc của bạn từ 8:00 đến 22:00 mỗi ngày.
            </p>
          </div>
          <Link
            to="/orders"
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F5DD20] text-[#05251C] font-display text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-md active:scale-95 shrink-0"
          >
            <PhoneCall size={14} />
            <span>Liên hệ chuyên viên</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
