import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, FileText, ArrowLeft, Lock, ChevronRight } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import privacyApi from "@/api/privacyApi";

export default function Privacy() {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "ATELIER ÉTOILE";
  useDocumentTitle(`Chính sách bảo vệ dữ liệu cá nhân — ${siteName}`);
  const [policy, setPolicy] = useState({ version: "2.1 (2026)", effectiveDate: "2026-01-01" });

  useEffect(() => {
    privacyApi
      .getPolicy()
      .then((response) => {
        const data = response?.data?.data || response?.data || response;
        if (data?.version) setPolicy(data);
      })
      .catch(() => {});
  }, []);

  const sections = [
    [
      "1. Chủ thể kiểm soát và xử lý dữ liệu",
      `Thương hiệu ${siteName} · Trụ sở: Tòa nhà Atelier Studio, Quận 1, TP. Hồ Chí Minh. Bộ phận bảo vệ dữ liệu tiếp nhận yêu cầu qua email: privacy@atelier-etoile.example.`
    ],
    [
      "2. Danh mục dữ liệu được thu thập",
      "Thông tin tài khoản: Họ tên, số điện thoại, email, địa chỉ giao nhận hàng hóa. Khi người dùng đồng ý, hệ thống thu thập thông tin lượt xem trang, tương tác và phiên ẩn danh (anonymousId) lưu trong localStorage để cá nhân hóa trải nghiệm."
    ],
    [
      "3. Mục đích xử lý dữ liệu",
      "Khởi tạo và bảo vệ tài khoản khách hàng, xác minh mã OTP bảo mật, xử lý đơn hàng và giao vận đồng kiểm, cung cấp thông tin cập nhật lộ trình giao hàng, giải quyết khiếu nại và đổi trả theo quy chuẩn."
    ],
    [
      "4. Các đối tác tiếp nhận dữ liệu thứ ba",
      "Cổng thanh toán trực tuyến (VNPay, ZaloPay) khi quý khách giao dịch thanh toán online; Đối tác giao vận uy tín (GHN) khi giao kiện hàng; Nền tảng Google OAuth khi đăng nhập tiện lợi."
    ],
    [
      "5. Thời hạn lưu trữ và bảo mật thông tin",
      "Dữ liệu tài khoản được lưu trữ an toàn trong suốt thời gian tài khoản hoạt động. Dữ liệu giao dịch được lưu trữ theo quy định kế toán hiện hành. Mật khẩu được mã hóa băm bằng thuật toán bảo mật cao phía máy chủ."
    ],
    [
      "6. Quyền của chủ thể dữ liệu (GDPR & PDPA)",
      "Quý khách có toàn quyền yêu cầu: Được biết mục đích xử lý, truy xuất dữ liệu cá nhân (Data Export), chỉnh sửa thông tin không chính xác, hoặc yêu cầu hủy tài khoản và xóa dữ liệu vĩnh viễn (Right to be Forgotten)."
    ],
    [
      "7. Quản lý đồng ý và rút lại quyền",
      <>
        Bạn có thể thay đổi thiết lập Cookie bất kỳ lúc nào tại mục &ldquo;Quyền riêng tư & Cookie&rdquo;. Thành viên có thể gửi yêu cầu xuất hoặc xóa dữ liệu tại trang{" "}
        <Link to="/profile/data-requests" className="font-semibold text-foreground underline hover:text-muted-foreground">
          Quản lý quyền dữ liệu cá nhân
        </Link>.
      </>
    ]
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-12 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <nav aria-label="Đường dẫn trang" className="mb-8 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
          <ChevronRight size={13} />
          <span className="text-foreground font-semibold">Chính sách bảo vệ dữ liệu</span>
        </nav>

        <article className="mx-auto max-w-4xl border border-border bg-card p-6 sm:p-12">
          <header className="border-b border-border pb-8">
            <div className="inline-flex items-center gap-2 border border-border px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase mb-4">
              <Lock size={12} strokeWidth={1.5} />
              <span>Bảo vệ quyền riêng tư & Dữ liệu khách hàng</span>
            </div>
            <h1 className="font-condensed text-3xl sm:text-5xl font-bold uppercase tracking-tight text-foreground">
              Chính Sách Bảo Vệ Dữ Liệu Cá Nhân
            </h1>
            <p className="mt-4 text-xs sm:text-sm text-muted-foreground font-sans">
              Phiên bản: {policy.version} · Ngày hiệu lực: {policy.effectiveDate} · Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
            </p>
          </header>

          <div className="mt-8 space-y-8 divide-y divide-border/40">
            {sections.map(([title, content], index) => (
              <section key={title} className={index > 0 ? "pt-6" : ""}>
                <h2 className="font-condensed text-lg sm:text-xl font-bold uppercase tracking-wide text-foreground">
                  {title}
                </h2>
                <div className="mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground font-sans">
                  {content}
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-12 border-t border-border pt-6 flex flex-wrap items-center justify-between gap-4 text-xs">
            <Link
              to="/profile/data-requests"
              className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:underline"
            >
              <FileText size={14} />
              <span>Gửi yêu cầu trích xuất hoặc xóa dữ liệu</span>
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
  );
}
