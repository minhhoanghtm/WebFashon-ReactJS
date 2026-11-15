import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { contentApi } from "../../api/endpoints";
import { Shield, BookOpen, Truck, HelpCircle, FileText, Info } from "lucide-react";

const STATIC_FALLBACKS = {
  policy: {
    title: "Tôn Chỉ Thương Hiệu & Cam Kết May Đo",
    subtitle: "Chất lượng hoàn thiện chuẩn mực trong từng đường kim mũi chỉ",
    icon: Shield,
    content: `
      WebFashion Atelier được xây dựng dựa trên niềm tin tuyệt đối vào sức mạnh của phom dáng chuẩn mực và sự chỉn chu của trang phục may đo.
      Mỗi thiết kế xuất xưởng đều trải qua quy trình kiểm tra chất lượng 4 bước nghiêm ngặt:
      1. Tuyển chọn sợi vải tự nhiên thượng hạng (Cashmere, Lụa Mulberry, Cotton Ai Cập).
      2. Cắt rập cá nhân hóa theo tỉ lệ cơ thể người Việt Nam.
      3. Ráp may và gia cố ve áo hoàn toàn thủ công.
      4. Ủi định hình và kiểm tra dung sai kích thước nhỏ hơn 0.5cm.
    `,
  },
  privacy: {
    title: "Chính Sách Bảo Mật Dữ Liệu Cá Nhân",
    subtitle: "Cam kết bảo vệ quyền riêng tư theo tiêu chuẩn quốc tế GDPR",
    icon: FileText,
    content: `
      Chúng tôi tôn trọng và bảo vệ tuyệt đối thông tin cá nhân của khách hàng.
      - Dữ liệu thu thập: Họ tên, số điện thoại, địa chỉ nhận hàng và số đo cơ thể phục vụ duy nhất cho mục đích hoàn thiện đơn may đo và giao hàng.
      - Cam kết không chia sẻ dữ liệu cho bất kỳ bên thứ ba nào vì mục đích quảng cáo ngoài luồng.
      - Quý khách có toàn quyền yêu cầu trích xuất hoặc xóa bỏ toàn bộ dữ liệu cá nhân tại trang Quản lý quyền riêng tư trong tài khoản.
    `,
  },
  terms: {
    title: "Điều Khoản Dịch Vụ & Mua Sắm",
    subtitle: "Quy định giao kết hợp đồng điện tử tại WebFashion Atelier",
    icon: BookOpen,
    content: `
      Khi truy cập và thực hiện đặt hàng trên website WebFashion Atelier, quý khách đồng ý tuân thủ các điều khoản sau:
      - Giá sản phẩm niêm yết bằng Việt Nam Đồng (VND) và đã bao gồm thuế VAT.
      - Đơn hàng chỉ được xác nhận khi hệ thống gửi thông báo thành công qua tin nhắn hoặc email.
      - Mọi hành vi gian lận mã ưu đãi hoặc đặt hàng giả mạo sẽ bị hủy đơn tự động và khóa tài khoản vĩnh viễn.
    `,
  },
  shipping: {
    title: "Chính Sách Vận Chuyển Toàn Quốc",
    subtitle: "Hợp tác cùng đối tác vận chuyển chuyên nghiệp GHN Express",
    icon: Truck,
    content: `
      - Thời gian giao hàng nội thành Hà Nội & TP. Hồ Chí Minh: 24 - 48 giờ làm việc.
      - Thời gian giao hàng các tỉnh thành khác: 2 - 4 ngày làm việc.
      - Biểu phí vận chuyển: Cố định 30.000 ₫ cho mọi đơn hàng dưới 500.000 ₫; Miễn phí vận chuyển cho đơn hàng từ 500.000 ₫ hoặc khi sử dụng Voucher Freeship.
      - Quy trình đồng kiểm: Khách hàng được phép mở gói hàng kiểm tra ngoại quan trước khi thanh toán cho bưu tá.
    `,
  },
  "returns-refunds": {
    title: "Quy Định Đổi Trả & Hoàn Tiền",
    subtitle: "Đổi mới trong vòng 7 ngày nếu không vừa size hoặc có lỗi từ nhà sản xuất",
    icon: Shield,
    content: `
      - Điều kiện đổi trả: Sản phẩm còn nguyên tem mác, chưa qua giặt tẩy, không có mùi lạ hoặc dấu hiệu đã qua sử dụng.
      - Hỗ trợ đổi size miễn phí một lần cho mọi sản phẩm may đo sẵn.
      - Quy trình hoàn tiền: Tiền sẽ được hoàn trả qua tài khoản ngân hàng hoặc ví điện tử của khách hàng trong vòng 3 - 5 ngày làm việc sau khi xưởng nhận lại kiện hàng.
    `,
  },
  "payment-policy": {
    title: "Chính Sách & Hướng Dẫn Thanh Toán",
    subtitle: "Hỗ trợ đa dạng phương thức thanh toán an toàn và tiện lợi",
    icon: FileText,
    content: `
      Atelier cung cấp 3 phương thức thanh toán chính:
      1. COD (Cash on Delivery): Thanh toán tiền mặt trực tiếp cho nhân viên giao hàng khi nhận sản phẩm.
      2. Ví điện tử MoMo: Quét mã QR siêu tốc và an toàn từ ứng dụng MoMo trên điện thoại.
      3. Cổng thanh toán VNPay: Chấp nhận thẻ ATM nội địa của tất cả ngân hàng Việt Nam và thẻ quốc tế Visa, MasterCard, JCB.
    `,
  },
  cookies: {
    title: "Chính Sách Quản Lý Cookies",
    subtitle: "Cách thức website lưu trữ trạng thái phiên và giỏ hàng",
    icon: Info,
    content: `
      Cookies là các tệp văn bản nhỏ được lưu trên trình duyệt của quý khách nhằm:
      - Duy trì trạng thái giỏ hàng khi chuyển trang.
      - Ghi nhớ tùy chọn giao diện Dark/Light mode.
      - Phân tích hiệu năng tải trang để liên tục tối ưu trải nghiệm người dùng.
      Quý khách có thể tùy ý tắt cookies trong cài đặt trình duyệt, tuy nhiên một số tính năng giỏ hàng có thể hoạt động không chính xác.
    `,
  },
  "contact-legal": {
    title: "Thông Tin Pháp Lý Doanh Nghiệp",
    subtitle: "Đơn vị vận hành và quyền sở hữu thương hiệu 404Studio",
    icon: Info,
    content: `
      - Tên doanh nghiệp: CÔNG TY TNHH THỜI TRANG MAY ĐO ĐƯƠNG ĐẠI ATELIER.
      - Showroom Hà Nội: Hoan Kiem District, Ha Noi.
      - Showroom TP.HCM: District 1, Ho Chi Minh City.
      - Hộp thư điện tử chính thức: contact@404studio.example
      - Giờ làm việc: 09:00 - 21:30 hàng ngày từ Thứ Hai đến Chủ Nhật.
    `,
  },
  faq: {
    title: "Câu Hỏi Thường Gặp (FAQ)",
    subtitle: "Giải đáp nhanh những thắc mắc phổ biến của khách hàng",
    icon: HelpCircle,
    content: `
      Q: Làm sao để chọn size vừa vặn nhất?
      A: Quý khách hãy tham khảo Bảng hướng dẫn chọn size chi tiết ở trang Hướng Dẫn Chọn Size hoặc gửi tin nhắn cho Trợ lý AI để được tư vấn kích thước ngực, eo, vai chuẩn xác.

      Q: Trang phục của Atelier có chỉnh sửa theo số đo riêng được không?
      A: Có. Với các sản phẩm dòng Haute Tailoring, quý khách có thể ghé trực tiếp Showroom hoặc đặt hẹn dịch vụ may đo tinh chỉnh theo số đo cá nhân.
    `,
  },
  guide: {
    title: "Hướng Dẫn Đo Kích Thước & Chọn Size",
    subtitle: "Quy chuẩn thông số may đo cho vóc dáng người mặc",
    icon: BookOpen,
    content: `
      Bảng thông số may đo tiêu chuẩn (Đơn vị: cm):
      - Size S (46): Ngực 88 - 92 | Eo 72 - 76 | Mông 90 - 94 | Chiều cao 1m60 - 1m68
      - Size M (48): Ngực 93 - 97 | Eo 77 - 81 | Mông 95 - 99 | Chiều cao 1m68 - 1m75
      - Size L (50): Ngực 98 - 102 | Eo 82 - 86 | Mông 100 - 104 | Chiều cao 1m75 - 1m82
      - Size XL (52): Ngực 103 - 108 | Eo 87 - 92 | Mông 105 - 110 | Chiều cao trên 1m80
    `,
  },
  about: {
    title: "Câu Chuyện Thương Hiệu Atelier",
    subtitle: "Hành trình tái định nghĩa thời trang may đo đơn sắc",
    icon: BookOpen,
    content: `
      Khởi đầu từ một xưởng may thủ công nhỏ với niềm say mê vẻ đẹp của những đường cắt sắc nét, WebFashion Atelier ra đời nhằm mang phong cách may đo may sẵn (Ready-to-Wear Tailoring) đến với giới trẻ hiện đại.
      Chúng tôi tin rằng sự tối giản không đồng nghĩa với đơn điệu; mà là việc loại bỏ những chi tiết thừa thãi để chất liệu và phom dáng cất lên tiếng nói mạnh mẽ nhất.
    `,
  },
  blog: {
    title: "Tạp Chí Phong Cách & Cảm Hứng Nghệ Thuật",
    subtitle: "Bài viết chuyên sâu về phối đồ, bảo quản vải và lịch sử may đo",
    icon: BookOpen,
    content: `
      Khám phá những bài viết mới nhất từ ban biên tập Atelier:
      - Nghệ thuật phối đồ Tone-sur-Tone: Bí quyết làm chủ phong cách Monochrome.
      - Hướng dẫn bảo quản áo khoác dạ Cashmere đúng cách để bền đẹp suốt 10 năm.
      - Xu hướng vai độn cấu trúc: Sự trở lại của thời trang thập niên 80 trong dòng chảy đương đại.
    `,
  },
};

export function StaticPages() {
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, "");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadPage() {
      setIsLoading(true);
      try {
        const res = await contentApi.getPage(slug).catch(() => null);
        if (active && res?.data) {
          setData(res.data);
        } else {
          setData(STATIC_FALLBACKS[slug] || STATIC_FALLBACKS.policy);
        }
      } catch (err) {
        setData(STATIC_FALLBACKS[slug] || STATIC_FALLBACKS.policy);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadPage();
    return () => {
      active = false;
    };
  }, [slug]);

  const fallback = STATIC_FALLBACKS[slug] || STATIC_FALLBACKS.policy;
  const title = data?.title || fallback.title;
  const subtitle = data?.subtitle || fallback.subtitle;
  const content = data?.content || fallback.content;

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full space-y-8 animate-fade-in">
      <div className="space-y-3 pb-6 border-b border-[rgba(244,240,232,0.1)]">
        <span className="text-xs font-mono uppercase tracking-widest text-[#e65100]">
          THÔNG TIN CHÍNH THỨC
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase text-[#f4f0e8]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[#9a989f] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      <div className="bg-[#121215] border border-[rgba(244,240,232,0.12)] p-6 sm:p-10 text-sm text-[#f4f0e8]/90 leading-relaxed whitespace-pre-line space-y-4 font-sans">
        {content}
      </div>

      <div className="pt-4 flex items-center justify-between text-xs text-[#9a989f]">
        <Link to="/" className="text-[#e65100] hover:underline font-mono">
          ← Quay lại trang chủ
        </Link>
        <span className="font-mono">Phiên bản tài liệu 2026.11</span>
      </div>
    </div>
  );
}
