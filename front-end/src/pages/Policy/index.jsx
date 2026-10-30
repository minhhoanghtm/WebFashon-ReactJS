import React, { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getPageBySlugService } from "@/services/page.service";
import { Sparkles, ShieldCheck, RefreshCw, Truck, Lock, CheckCircle2 } from "lucide-react";

import HeroSection from "@/components/page-sections/HeroSection";
import StorySection from "@/components/page-sections/StorySection";
import GallerySection from "@/components/page-sections/GallerySection";
import QuoteSection from "@/components/page-sections/QuoteSection";
import ImageTextSection from "@/components/page-sections/ImageTextSection";
import ProductsSection from "@/components/page-sections/ProductsSection";
import BannerSection from "@/components/page-sections/BannerSection";
import CTASection from "@/components/page-sections/CTASection";

const policiesData = [
  {
    id: "return",
    title: "1. CHÍNH SÁCH ĐỔI TRẢ TRONG 07 NGÀY",
    icon: RefreshCw,
    points: [
      "Áp dụng đổi hàng miễn phí trong vòng 7 ngày kể từ thời điểm nhận hàng thành công.",
      "Sản phẩm đổi phải còn nguyên tag giá, nhãn mác thương hiệu, chưa qua sử dụng, giặt ủi hay dính mùi lạ.",
      "Hỗ trợ đổi size, đổi màu hoặc đổi sang bất kỳ mẫu sản phẩm nào có giá trị tương đương hoặc cao hơn.",
      "Nếu lỗi phát sinh từ khâu sản xuất hoặc vận chuyển hư hại, 404Studio chịu 100% phí vận chuyển 2 chiều.",
    ],
  },
  {
    id: "shipping",
    title: "2. CHÍNH SÁCH VẬN CHUYỂN & GIAO NHẬN",
    icon: Truck,
    points: [
      "Miễn phí vận chuyển toàn quốc cho đơn hàng từ 500.000₫.",
      "Nội thành Hà Nội & TP. Hồ Chí Minh: Giao hàng hỏa tốc trong 24h - 48h làm việc.",
      "Các tỉnh thành khác: Giao hàng tiêu chuẩn từ 2 - 4 ngày làm việc qua đối tác vận chuyển chuyên nghiệp.",
      "Được quyền mở hộp đồng kiểm chất lượng trước khi thanh toán tiền mặt cho bưu tá.",
    ],
  },
  {
    id: "security",
    title: "3. BẢO MẬT THÔNG TIN & AN TOÀN THANH TOÁN",
    icon: Lock,
    points: [
      "Bảo mật tuyệt đối thông tin thanh toán qua các cổng chuẩn quốc tế PCI-DSS (VNPay, MoMo).",
      "Dữ liệu cá nhân (tên, số điện thoại, địa chỉ nhận hàng) chỉ sử dụng duy nhất cho mục đích xử lý đơn hàng và chăm sóc hậu mãi.",
      "Cam kết không chia sẻ hoặc thương mại hóa thông tin của quý khách cho bất kỳ bên thứ ba nào.",
    ],
  },
  {
    id: "guarantee",
    title: "4. CAM KẾT CHẤT LƯỢNG MAY ĐO",
    icon: ShieldCheck,
    points: [
      "100% hình ảnh sản phẩm được chụp thực tế tại studio của thương hiệu, đúng màu sắc và phom dáng.",
      "Chất liệu vải cao cấp được tuyển chọn tỉ mỉ: French Flax Linen, Cotton chải kỹ, Wool Twill.",
      "Hỗ trợ chỉnh sửa đường may, khuy cúc trọn đời tại hệ thống cửa hàng của chúng tôi.",
    ],
  },
];

export const Policy = () => {
  useDocumentTitle("Chính sách & Điều khoản — 404STUDIO");
  const [contentHtml, setContentHtml] = useState("");
  const [pageSections, setPageSections] = useState([]);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const data = await getPageBySlugService("chinh-sach").catch(() =>
          getPageBySlugService("policy").catch(() => null)
        );
        const page = data?.page || data;
        const sections = data?.sections || data?.page?.sections || [];
        if (page?.content) setContentHtml(page.content);
        if (sections && sections.length > 0) setPageSections(sections);
      } catch (err) {
        console.error("Lỗi khi tải thông tin chính sách:", err);
      }
    };
    fetchPolicy();
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#05251C] py-12 sm:py-20 select-none">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#05251C]/5 border border-[#05251C]/10 text-[10px] font-black tracking-[0.25em] text-[#05251C] uppercase mb-4">
            <Sparkles size={12} className="text-[#05251C]" />
            <span>TRANSPARENCY & TRUST</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#05251C] uppercase font-display leading-[0.92] tracking-tighter">
            CHÍNH SÁCH ATELIER.
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-[#6B716E] max-w-lg mx-auto leading-relaxed">
            Cam kết minh bạch và quyền lợi khách hàng chuẩn mực cao cấp tại thương hiệu 404Studio.
          </p>
        </div>

        {/* Dynamic Sections if CMS exists */}
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

        {/* Policies Grid */}
        <div className="space-y-8">
          {policiesData.map((pol) => {
            const Icon = pol.icon;
            return (
              <div
                key={pol.id}
                className="bg-white rounded-3xl border border-[#05251C]/10 p-6 sm:p-10 shadow-xs hover:border-[#05251C]/30 transition-colors"
              >
                <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-[#05251C]/10">
                  <div className="w-10 h-10 rounded-xl bg-[#05251C] text-[#F5DD20] flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-[#05251C] uppercase tracking-tight">
                    {pol.title}
                  </h2>
                </div>

                <ul className="space-y-3.5">
                  {pol.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#6B716E] leading-relaxed">
                      <CheckCircle2 size={16} className="text-[#05251C] shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Policy;
