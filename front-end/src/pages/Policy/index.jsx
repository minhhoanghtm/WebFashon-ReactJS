import React, { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
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
    title: "1. Chính sách đổi trả linh hoạt 30 ngày",
    icon: RefreshCw,
    points: [
      "Áp dụng đổi hàng miễn phí trong vòng 30 ngày kể từ thời điểm nhận hàng thành công.",
      "Sản phẩm đổi phải còn nguyên tag giá, nhãn mác thương hiệu, chưa qua sử dụng, giặt ủi hay dính mùi lạ.",
      "Hỗ trợ đổi size, đổi màu hoặc đổi sang bất kỳ mẫu sản phẩm nào có giá trị tương đương hoặc cao hơn.",
      "Nếu lỗi phát sinh từ khâu sản xuất hoặc vận chuyển hư hại, Atelier chịu 100% chi phí vận chuyển 2 chiều.",
    ],
  },
  {
    id: "shipping",
    title: "2. Chính sách vận chuyển & Giao nhận đồng kiểm",
    icon: Truck,
    points: [
      "Miễn phí vận chuyển tiêu chuẩn toàn quốc cho đơn hàng từ 500.000₫.",
      "Nội thành Hà Nội & TP. Hồ Chí Minh: Giao hàng hỏa tốc trong 24h - 48h làm việc.",
      "Các tỉnh thành khác: Giao hàng tiêu chuẩn từ 2 - 4 ngày làm việc qua đối tác vận chuyển chuyên nghiệp.",
      "Được quyền mở hộp đồng kiểm chất lượng trước khi thanh toán cho nhân viên bưu tá.",
    ],
  },
  {
    id: "security",
    title: "3. Bảo mật thông tin & An toàn thanh toán",
    icon: Lock,
    points: [
      "Bảo mật tuyệt đối thông tin thanh toán qua các cổng chuẩn quốc tế PCI-DSS (VNPay, ZaloPay).",
      "Dữ liệu cá nhân (tên, số điện thoại, địa chỉ nhận hàng) chỉ sử dụng duy nhất cho mục đích xử lý đơn hàng và chăm sóc hậu mãi.",
      "Cam kết không chia sẻ hoặc thương mại hóa thông tin của quý khách cho bất kỳ bên thứ ba nào.",
    ],
  },
  {
    id: "guarantee",
    title: "4. Cam kết chất lượng may đo chuẩn mực",
    icon: ShieldCheck,
    points: [
      "100% hình ảnh sản phẩm được chụp thực tế tại studio của thương hiệu, đúng màu sắc và phom dáng.",
      "Chất liệu vải cao cấp được tuyển chọn tỉ mỉ: French Flax Linen, Cotton chải kỹ, Wool Twill, Lụa Mulberry.",
      "Hỗ trợ chỉnh sửa đường may, khuy cúc trọn đời tại hệ thống Atelier.",
    ],
  },
  {
    id: "cookie-policy",
    title: "5. Quyền riêng tư dữ liệu & Cookie Consent",
    icon: Lock,
    points: [
      "Cookie cần thiết (Strictly Necessary): Duy trì phiên đăng nhập an toàn, giỏ hàng, giữ hàng tồn kho chính xác (Redis Reservation).",
      "Phân tích hành vi (Analytics): Chỉ kích hoạt khi bạn đồng ý, thu thập dữ liệu ẩn danh để cải thiện trải nghiệm mua sắm.",
      "Cá nhân hóa (Personalization): Gợi ý thiết kế phù hợp dựa trên AI Recommendation khi có sự cho phép.",
      "Quyền kiểm soát: Bạn có toàn quyền tùy chỉnh hoặc rút lại sự đồng ý bất cứ lúc nào tại liên kết 'Quyền riêng tư & Cookie'.",
    ],
  },
];

export const Policy = () => {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "ATELIER ÉTOILE";
  useDocumentTitle(`Chính sách & Cam kết — ${siteName}`);
  const [pageSections, setPageSections] = useState([]);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const data = await getPageBySlugService("chinh-sach").catch(() =>
          getPageBySlugService("policy").catch(() => null)
        );
        const sections = data?.sections || data?.page?.sections || [];
        if (sections && sections.length > 0) setPageSections(sections);
      } catch (err) {
        console.error("Lỗi khi tải thông tin chính sách:", err);
      }
    };
    fetchPolicy();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground py-12 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 border border-border px-3.5 py-1 text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase mb-4">
            <Sparkles size={13} strokeWidth={1.5} />
            <span>Cam kết minh bạch & Quyền lợi khách hàng</span>
          </div>

          <h1 className="font-condensed text-4xl sm:text-6xl font-bold uppercase tracking-tight text-foreground">
            Chính Sách Atelier
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Quy chuẩn dịch vụ hậu mãi và bảo hộ trải nghiệm khách hàng tối ưu tại {siteName}.
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
        <div className="space-y-6 max-w-4xl mx-auto">
          {policiesData.map((pol) => {
            const Icon = pol.icon;
            return (
              <div
                key={pol.id}
                className="border border-border bg-card p-6 sm:p-8 transition-colors hover:border-foreground/30"
              >
                <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-border">
                  <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center shrink-0">
                    <Icon size={16} />
                  </div>
                  <h2 className="font-condensed text-lg sm:text-xl font-bold text-foreground uppercase tracking-wide">
                    {pol.title}
                  </h2>
                </div>

                <ul className="space-y-3" role="list">
                  {pol.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                      <CheckCircle2 size={15} className="text-foreground shrink-0 mt-0.5" />
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
