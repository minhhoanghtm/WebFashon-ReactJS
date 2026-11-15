import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ArrowUpRight, Award } from "lucide-react";
import { toast } from "react-toastify";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import useFeatureFlags from "@/hooks/useFeatureFlags";
import { useConsent } from "@/context/ConsentContext";
import { ONLINE_GOV_CONFIRMATION_URL } from "@/config/legalLinks";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { settings } = useWebsiteSettings();
  const { flags } = useFeatureFlags();
  const { openPreferences } = useConsent();

  const general = settings?.general || {};
  const socialLinks = settings?.socialLinks || {};
  const footerData = settings?.footer || {};

  const siteName = general.siteName || "404 STUDIO";
  const address = general.address || "";
  const hotline = general.hotline || "";
  const contactEmail = general.email || "";
  const companyName = footerData.companyName || "";
  const taxCode = footerData.taxCode || "";
  const legalInfoMissing = !companyName || !taxCode || !address || !hotline || !contactEmail;
  const copyrightText =
    footerData.copyrightText ||
    `© ${new Date().getFullYear()} ${siteName} ATELIER. BẢN QUYỀN ĐƯỢC BẢO HỘ.`;

  const handleSubscribe = (event) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập địa chỉ email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Địa chỉ email không hợp lệ.");
      return;
    }
    toast.success(`Đã đăng ký nhận bản tin từ ${siteName} Atelier.`);
    setEmail("");
  };

  return (
    <footer className="border-t border-border bg-[#0C0C0E] text-[#F5F4F0]">
      <div className="mx-auto max-w-[1440px] px-4 pt-16 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pt-20 sm:pb-12 lg:px-10">
        {/* Top Row: Editorial Colophon & Newsletter */}
        <div className="grid grid-cols-1 gap-12 border-b border-white/10 pb-14 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            {/* Exclusive Gold Seal of Authenticity */}
            <div className="atelier-seal inline-flex items-center gap-2 border px-3 py-1 text-[10px] font-medium tracking-[0.24em] uppercase">
              <Award size={13} strokeWidth={1.5} />
              <span>Con dấu Chứng nhận Chế tác · Atelier Seal</span>
            </div>

            <h2 className="font-sans text-3xl font-light tracking-tight text-[#F5F4F0] sm:text-5xl leading-[1.28]">
              Tinh thần tối giản đơn sắc.
              <br />
              <span className="italic text-[#9E9EA8]">
                Chuẩn mực may đo đương đại.
              </span>
            </h2>

            <p className="max-w-lg text-xs leading-[1.65] text-[#9E9EA8] sm:text-sm">
              Mỗi thiết kế tại {siteName} được định hình từ cấu trúc phom dáng
              tinh gọn, tôn vinh vẻ đẹp nguyên bản và sự tĩnh lặng vượt thời
              gian.
            </p>
          </div>

          {/* Newsletter Box */}
          <div className="flex flex-col justify-end lg:col-span-5">
            <div className="border border-white/12 bg-white/[0.02] p-6 sm:p-8">
              <h3 className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#F5F4F0] leading-[1.4]">
                Bản tin Giám tuyển (Editorial Dispatch)
              </h3>
              <p className="mt-2 mb-5 text-xs leading-[1.65] text-[#9E9EA8]">
                Đăng ký nhận thông báo sớm khi ra mắt bộ sưu tập mùa mới và các
                chương trình ưu đãi thành viên.
              </p>
              <form
                onSubmit={handleSubscribe}
                className="flex flex-col gap-2.5 sm:flex-row"
              >
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Địa chỉ email của bạn
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email của bạn..."
                  className="h-11 min-h-[44px] flex-1 border border-white/15 bg-transparent px-4 text-xs text-[#F5F4F0] placeholder:text-[#9E9EA8]/60 focus:border-[#F5F4F0] focus:outline-none"
                />
                <button
                  type="submit"
                  className="touch-target inline-flex min-h-[44px] items-center justify-center gap-1.5 bg-[#F5F4F0] px-6 text-xs font-semibold tracking-[0.16em] uppercase text-[#0C0C0E] transition-opacity hover:opacity-90"
                >
                  <span>Đăng ký</span>
                  <ArrowUpRight size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Middle Row: Navigation Directory */}
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Collections */}
          <div>
            <h4 className="mb-4 text-[11px] font-semibold tracking-[0.22em] uppercase text-[#F5F4F0] leading-[1.4]">
              Danh mục Giám tuyển
            </h4>
            <ul className="space-y-1 text-xs text-[#9E9EA8]">
              <li>
                <Link
                  to="/products"
                  className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
                >
                  Tất cả sản phẩm
                </Link>
              </li>
              <li>
                <Link
                  to="/products?sort=newest"
                  className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
                >
                  Thiết kế mới nhất
                </Link>
              </li>
              <li>
                <Link
                  to="/lookbooks"
                  className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
                >
                  Hồ sơ Lookbook
                </Link>
              </li>
              {flags.enableVoucher && (
                <li>
                  <Link
                    to="/vouchers"
                    className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
                  >
                    Ưu đãi & Voucher
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Column 2: Customer Care */}
          <div>
            <h4 className="mb-4 text-[11px] font-semibold tracking-[0.22em] uppercase text-[#F5F4F0] leading-[1.4]">
              Dịch vụ Khách hàng
            </h4>
            <ul className="space-y-1 text-xs text-[#9E9EA8]">
              <li>
                <Link
                  to="/order-lookup"
                  className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
                >
                  Tra cứu đơn hàng
                </Link>
              </li>
              <li>
                <Link
                  to="/guide"
                  className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
                >
                  Hướng dẫn chọn kích cỡ
                </Link>
              </li>
              <li>
                <Link
                  to="/returns-refunds"
                  className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
                >
                  Đổi trả & hoàn tiền
                </Link>
              </li>
              <li><Link to="/shipping" className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]">Vận chuyển</Link></li>
              <li><Link to="/payment-policy" className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]">Thanh toán</Link></li>
              <li>
                <Link
                  to="/faq"
                  className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
                >
                  Câu hỏi thường gặp (FAQ)
                </Link>
              </li>
              <li><Link to="/terms" className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]">Điều khoản mua bán</Link></li>
              <li><Link to="/privacy" className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]">Bảo vệ dữ liệu cá nhân</Link></li>
              <li><Link to="/cookies" className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]">Chính sách Cookie</Link></li>
              <li><Link to="/contact-legal" className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]">Thông tin pháp lý</Link></li>
              <li>
                <Link
                  to="/orders"
                  className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
                >
                  Tra cứu đơn hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Brand & Editorial */}
          <div>
            <h4 className="mb-4 text-[11px] font-semibold tracking-[0.22em] uppercase text-[#F5F4F0] leading-[1.4]">
              Về {siteName}
            </h4>
            <ul className="space-y-1 text-xs text-[#9E9EA8]">
              <li>
                <Link
                  to="/about"
                  className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
                >
                  Câu chuyện thương hiệu
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
                >
                  Tạp chí & Bài viết
                </Link>
              </li>
              <li>
                <Link
                  to="/favorites"
                  className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
                >
                  Danh sách yêu thích
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Atelier Contact */}
          <div>
            <h4 className="mb-4 text-[11px] font-semibold tracking-[0.22em] uppercase text-[#F5F4F0] leading-[1.4]">
              Liên hệ Atelier
            </h4>
            <div className="space-y-3 text-xs text-[#9E9EA8]">
              {legalInfoMissing ? <p className="border border-amber-300/40 bg-amber-300/10 p-3 text-amber-100">Thông tin pháp lý đang được hoàn thiện. Quản trị viên cần cập nhật tên pháp lý, MST, địa chỉ, hotline và email.</p> : <><p className="font-medium text-[#F5F4F0]">{companyName}</p><p>MST/ĐKKD: {taxCode}</p></>}
              {address && (
                <p className="flex items-start gap-2.5 leading-[1.4]">
                  <MapPin
                    size={15}
                    strokeWidth={1.5}
                    className="mt-0.5 shrink-0 text-[#F5F4F0]"
                  />
                  <span>{address}</span>
                </p>
              )}
              {hotline && (
                <p className="flex items-center gap-2.5 leading-[1.4]">
                  <Phone
                    size={15}
                    strokeWidth={1.5}
                    className="shrink-0 text-[#F5F4F0]"
                  />
                  <a
                    href={`tel:${hotline.replace(/\s+/g, "")}`}
                    className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
                  >
                    {hotline}
                  </a>
                </p>
              )}
              {contactEmail && (
                <p className="flex items-center gap-2.5 leading-[1.4]">
                  <Mail
                    size={15}
                    strokeWidth={1.5}
                    className="shrink-0 text-[#F5F4F0]"
                  />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
                  >
                    {contactEmail}
                  </a>
                </p>
              )}

              {/* Social Links */}
              <div className="flex flex-wrap items-center gap-2 pt-3">
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="touch-target inline-flex min-h-[44px] items-center justify-center border border-white/15 px-3 text-[11px] tracking-[0.14em] uppercase text-[#F5F4F0] transition-colors hover:bg-white hover:text-[#0C0C0E]"
                  >
                    Facebook
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="touch-target inline-flex min-h-[44px] items-center justify-center border border-white/15 px-3 text-[11px] tracking-[0.14em] uppercase text-[#F5F4F0] transition-colors hover:bg-white hover:text-[#0C0C0E]"
                  >
                    Instagram
                  </a>
                )}
                {socialLinks.tiktok && (
                  <a
                    href={socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="touch-target inline-flex min-h-[44px] items-center justify-center border border-white/15 px-3 text-[11px] tracking-[0.14em] uppercase text-[#F5F4F0] transition-colors hover:bg-white hover:text-[#0C0C0E]"
                  >
                    TikTok
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Architectural Watermark Wordmark - unclipped */}
        <div
          className="overflow-hidden py-10 text-center select-none"
          aria-hidden="true"
        >
          <span className="block font-condensed text-[13vw] leading-[1.2] font-bold tracking-[0.08em] uppercase text-white/[0.06] pt-2 pb-2">
            {siteName}
          </span>
        </div>

        {/* Bottom Colophon */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-[11px] tracking-[0.12em] text-[#9E9EA8] sm:flex-row">
          <p className="leading-[1.4]">{copyrightText}</p>
          <div className="flex items-center gap-4 sm:gap-6">
            {ONLINE_GOV_CONFIRMATION_URL && (
              <a href={ONLINE_GOV_CONFIRMATION_URL} target="_blank" rel="noopener noreferrer" className="touch-target inline-flex min-h-[44px] items-center border border-white/20 px-2.5 text-[10px] font-semibold uppercase tracking-wide text-[#F5F4F0] hover:bg-white hover:text-[#0C0C0E]">
                Đã thông báo BCT
              </a>
            )}
            <button
              type="button"
              id="footer-privacy-cookie-btn"
              onClick={openPreferences}
              className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0] cursor-pointer"
            >
              Quyền riêng tư & Cookie
            </button>
            <span aria-hidden="true">·</span>
            <Link
              to="/privacy"
              className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
            >
              Bảo mật
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              to="/terms"
              className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
            >
              Điều khoản
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              to="/about"
              className="touch-target inline-flex min-h-[44px] items-center transition-colors hover:text-[#F5F4F0]"
            >
              Về Atelier
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
