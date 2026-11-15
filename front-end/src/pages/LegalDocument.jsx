import React from "react";
import { Link } from "react-router-dom";
import { Shield, FileText, ArrowLeft, ExternalLink, ChevronRight } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

export const legalDocuments = {
  terms: {
    slug: "terms",
    title: "Điều khoản dịch vụ & Giao dịch",
    category: "Quy định thương mại",
    version: "2.1 (2026)",
    sections: [
      [
        "1. Nguyên tắc giao kết hợp đồng điện tử",
        "Mọi đơn hàng được tạo lập trên nền tảng trực tuyến đều mang tính chất xác thực nhu cầu sở hữu sản phẩm từ khách hàng. Atelier bảo lưu quyền thẩm định tình trạng khả dụng của sản phẩm và xác nhận đơn qua phương tiện điện tử trước khi tiến hành đóng gói và xuất kho."
      ],
      [
        "2. Biểu giá, Thuế & Nghĩa vụ thanh toán",
        "Giá niêm yết trên website là giá thanh toán cuối cùng đã bao gồm thuế giá trị gia tăng (VAT). Khách hàng có quyền yêu cầu xuất hóa đơn điện tử hợp lệ theo quy định của pháp luật trong vòng 48 giờ kể từ lúc đặt hàng thành công."
      ],
      [
        "3. Trách nhiệm người mua & Chấm dứt giao dịch",
        "Khách hàng cam kết cung cấp thông tin liên hệ và địa chỉ nhận hàng chính xác. Atelier bảo lưu quyền từ chối hoặc hủy đơn trong các trường hợp có dấu hiệu gian lận khuyến mãi hoặc không liên hệ được với người nhận sau 3 lần giao vận."
      ]
    ]
  },
  shipping: {
    slug: "shipping",
    title: "Chính sách vận chuyển & Giao nhận",
    category: "Hậu cần & Vận tải",
    version: "2.1 (2026)",
    sections: [
      [
        "1. Phạm vi & Đối tác vận chuyển",
        "Atelier hợp tác cùng các đơn vị vận chuyển cao cấp (GHN Express, Viettel Post) nhằm cung cấp dịch vụ giao hàng tận nơi trên toàn quốc, có bảo hiểm giá trị hàng hóa 100%."
      ],
      [
        "2. Thời gian giao hàng tiêu chuẩn",
        "Khu vực nội thành Hà Nội & TP. Hồ Chí Minh: 24 - 48 giờ làm việc. Khu vực các tỉnh thành khác: 2 - 4 ngày làm việc. Đơn hàng thuộc các bộ sưu tập giới hạn (Pre-order / Made-to-measure) sẽ được thông báo lịch hẹn riêng."
      ],
      [
        "3. Quy trình đồng kiểm & Niêm phong",
        "Mọi kiện hàng đều được đóng gói trong hộp Atelier chuyên dụng có tem niêm phong chống giả mạo. Khách hàng được quyền kiểm tra ngoại quan kiện hàng trước khi ký nhận."
      ]
    ]
  },
  returns: {
    slug: "returns-refunds",
    title: "Chính sách đổi trả & Hoàn tiền",
    category: "Quyền lợi khách hàng",
    version: "2.1 (2026)",
    sections: [
      [
        "1. Điều kiện áp dụng đổi trả",
        "Atelier chấp thuận đổi hàng trong vòng 30 ngày kể từ ngày nhận hàng đối với sản phẩm còn nguyên tem mác, nguyên hộp, chưa qua giặt tẩy hoặc sử dụng, và không có mùi lạ."
      ],
      [
        "2. Quy trình đổi size & Đổi mẫu",
        "Khách hàng có thể yêu cầu đổi size hoặc đổi sang thiết kế khác có giá trị tương đương hoặc cao hơn. Đội ngũ CSKH hỗ trợ nhân viên bưu tá giao sản phẩm mới đồng thời thu hồi sản phẩm đổi tận nơi."
      ],
      [
        "3. Phương thức hoàn tiền",
        "Trường hợp sản phẩm có lỗi từ nhà sản xuất, khách hàng được hoàn tiền 100% qua tài khoản ngân hàng hoặc cổng thanh toán ban đầu (VNPay/ZaloPay) trong vòng 3-5 ngày làm việc."
      ]
    ]
  },
  payment: {
    slug: "payment-policy",
    title: "Chính sách thanh toán an toàn",
    category: "Giao dịch bảo mật",
    version: "2.1 (2026)",
    sections: [
      [
        "1. Phương thức thanh toán được hỗ trợ",
        "Hỗ trợ đa dạng phương thức: Thanh toán khi nhận hàng (COD), Chuyển khoản ngân hàng trực tiếp có quét mã QR tự động, Thẻ ATM nội địa và Thẻ quốc tế (Visa/Mastercard) qua cổng thanh toán VNPay và ZaloPay an toàn."
      ],
      [
        "2. Tiêu chuẩn bảo mật giao dịch PCI-DSS",
        "Website không lưu trữ thông tin số thẻ tín dụng hoặc mật khẩu thanh toán của khách hàng. Mọi giao dịch trực tuyến đều được mã hóa theo tiêu chuẩn SSL/TLS 256-bit."
      ]
    ]
  },
  cookies: {
    slug: "cookies",
    title: "Chính sách quản lý Cookie & Theo dõi",
    category: "Quyền riêng tư kỹ thuật số",
    version: "2.1 (2026)",
    sections: [
      [
        "1. Mục đích sử dụng Cookie",
        "Website sử dụng Cookie cần thiết để duy trì phiên đăng nhập và giỏ hàng của bạn. Ngoài ra, Cookie hiệu năng và cá nhân hóa chỉ hoạt động khi bạn đồng ý tại biểu ngữ Cookie Consent."
      ],
      [
        "2. Quyền kiểm soát & Thu hồi đồng ý",
        "Bạn có toàn quyền tùy chỉnh hoặc rút lại sự đồng ý bất cứ lúc nào thông qua công cụ Quản lý quyền riêng tư ở chân trang."
      ]
    ]
  },
  contact: {
    slug: "contact-legal",
    title: "Thông tin pháp lý & Liên hệ chính thức",
    category: "Minh bạch thông tin",
    version: "2.1 (2026)",
    sections: [
      [
        "1. Đơn vị sở hữu & Vận hành",
        "Thương hiệu thời trang ATELIER ÉTOILE · Quản lý bởi Công ty Cổ phần Thời trang Đương đại Việt Nam. Giấy phép ĐKKD số: 0108998877 do Sở Kế hoạch và Đầu tư cấp."
      ],
      [
        "2. Trụ sở & Kênh liên hệ chính thức",
        "Trụ sở: Tòa nhà Atelier Studio, Quận 1, TP. Hồ Chí Minh. Hotline hỗ trợ: 1900 6868. Email pháp lý & tiếp nhận phản ánh: legal@atelier-etoile.example."
      ]
    ]
  }
};

const LEGAL_NAV_ITEMS = [
  { path: "/terms", label: "Điều khoản dịch vụ" },
  { path: "/shipping", label: "Chính sách vận chuyển" },
  { path: "/returns-refunds", label: "Đổi trả & Hoàn tiền" },
  { path: "/payment-policy", label: "Chính sách thanh toán" },
  { path: "/privacy", label: "Bảo vệ dữ liệu cá nhân" },
  { path: "/cookies", label: "Chính sách Cookie" },
  { path: "/contact-legal", label: "Thông tin pháp lý" }
];

export default function LegalDocument({ document }) {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "ATELIER ÉTOILE";
  useDocumentTitle(`${document?.title || "Chính sách"} — ${siteName}`);

  if (!document) return null;

  return (
    <div className="min-h-screen bg-background text-foreground py-12 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Đường dẫn trang" className="mb-8 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
          <ChevronRight size={13} />
          <span className="text-foreground font-semibold">{document.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column: Legal Menu Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-4">
                <Shield size={14} strokeWidth={1.5} />
                <span>Trung tâm Pháp lý</span>
              </div>
              <ul className="space-y-1.5" role="list">
                {LEGAL_NAV_ITEMS.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`block py-2 text-xs font-medium transition-colors ${
                        window.location.pathname === item.path
                          ? "text-foreground font-bold pl-2 border-l-2 border-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-border/80 bg-muted/30 p-5 text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground uppercase tracking-wider text-[11px]">Cam kết tuân thủ</p>
              <p className="leading-relaxed">
                Mọi quy định được soạn thảo minh bạch, tuân thủ Nghị định 52/2013/NĐ-CP và Luật Bảo vệ quyền lợi người tiêu dùng.
              </p>
            </div>
          </aside>

          {/* Right Column: Document Body */}
          <article className="lg:col-span-8 border border-border bg-card p-6 sm:p-12">
            <header className="border-b border-border pb-8">
              <span className="inline-block text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                {document.category || "Văn bản quy phạm"} · {document.version || "Bản hành 2026"}
              </span>
              <h1 className="mt-3 font-condensed text-3xl font-bold tracking-tight text-foreground uppercase sm:text-5xl">
                {document.title}
              </h1>
              <p className="mt-3 text-xs text-muted-foreground">
                Hiệu lực áp dụng trên toàn bộ hệ thống bán lẻ trực tuyến và cửa hàng Atelier.
              </p>
            </header>

            <div className="mt-8 space-y-8 divide-y divide-border/40">
              {document.sections?.map(([heading, text], index) => (
                <section key={heading} className={index > 0 ? "pt-6" : ""}>
                  <h2 className="font-condensed text-lg font-bold text-foreground uppercase tracking-wide sm:text-xl">
                    {heading}
                  </h2>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground font-sans">
                    {text}
                  </p>
                </section>
              ))}
            </div>

            <footer className="mt-12 border-t border-border pt-6 flex flex-wrap items-center justify-between gap-4 text-xs">
              <Link
                to="/privacy"
                className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:underline"
              >
                <FileText size={14} />
                <span>Xem thêm Chính sách bảo vệ dữ liệu cá nhân</span>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Trở về trang chủ</span>
              </Link>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}
