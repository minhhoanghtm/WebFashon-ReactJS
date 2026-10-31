import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { toast } from "react-toastify";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import HOME_CONTENT from "../content";

export const NewsletterFooterSection = () => {
  const [email, setEmail] = useState("");
  const { settings, loading } = useWebsiteSettings();

  const general = settings?.general || {};
  const socialLinks = settings?.socialLinks || {};
  const footerData = settings?.footer || {};

  const siteName =
    !loading && general.siteName ? general.siteName : "404 STUDIO";
  const address =
    general.address || "104 Đồng Khởi, Quận 1, TP. Hồ Chí Minh";
  const hotline = general.hotline || "+84 (0) 90 404 8888";
  const contactEmail = general.email || "contact@404studio.vn";
  const copyrightText =
    footerData.copyrightText ||
    `© ${new Date().getFullYear()} ${siteName} ATELIER. BẢN QUYỀN ĐƯỢC BẢO HỘ.`;

  const { newsletter, footer } = HOME_CONTENT;

  const handleSubscribe = (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập địa chỉ email của bạn.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Địa chỉ email không đúng định dạng.");
      return;
    }
    toast.success(`Đã đăng ký nhận bản tin độc quyền từ ${siteName} Atelier.`);
    setEmail("");
  };

  return (
    <div className="relative z-10 w-full overflow-hidden bg-black text-white">
      {/* 1. Newsletter: Full-bleed dark background with 1-line form */}
      <section
        aria-label="Đăng ký nhận bản tin Atelier"
        className="relative z-20 bg-[#060709] border-t border-white/10 px-4 py-24 sm:px-8 sm:py-32 lg:px-14 flex items-center justify-center text-center"
      >
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-2">
            <span className="font-mono text-xs tracking-[0.32em] text-white/50 uppercase">
              {newsletter.eyebrow}
            </span>
            <h2 className="font-condensed text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight text-white leading-none">
              {newsletter.title}
            </h2>
            <p className="mx-auto max-w-lg font-sans text-xs sm:text-sm text-white/65 leading-relaxed pt-2">
              {newsletter.description}
            </p>
          </div>

          {/* 1-Line Thin-Bordered Subscription Form */}
          <form
            onSubmit={handleSubscribe}
            className="mx-auto flex max-w-md flex-col sm:flex-row gap-3 pt-2"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={newsletter.placeholder}
              aria-label="Địa chỉ email đăng ký"
              className="min-h-[48px] flex-1 border border-white/25 bg-transparent px-5 text-xs text-white placeholder:text-white/40 outline-none transition-colors focus:border-white font-sans"
            />
            <button
              type="submit"
              className="inline-flex min-h-[48px] items-center justify-center border border-white/40 bg-transparent px-8 text-xs font-semibold tracking-[0.24em] text-white uppercase transition-all duration-300 hover:border-white hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <span>{newsletter.buttonText}</span>
            </button>
          </form>

          <p className="font-mono text-[10px] tracking-wider text-white/40 uppercase">
            {newsletter.privacyText}
          </p>
        </div>
      </section>

      {/* 2. Footer Reveal: White editorial footer revealed underneath */}
      <footer
        role="contentinfo"
        aria-label="Chân trang Atelier"
        className="relative z-10 bg-[#FBF9F5] text-[#05251C] border-t border-[#05251C]/15 px-4 pt-20 pb-12 sm:px-8 sm:pt-28 lg:px-14 shadow-inner"
      >
        <div className="mx-auto max-w-[1600px] space-y-16">
          {/* Top Row: Giant Navigation Links (Left) + Contact Details (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Big Condensed Navigation Links (~60%) */}
            <div className="lg:col-span-7 space-y-4">
              <span className="font-mono text-xs tracking-[0.28em] text-[#05251C]/50 uppercase">
                ĐIỀU HƯỚNG NHANH
              </span>
              <nav
                aria-label="Liên kết chân trang"
                className="flex flex-col space-y-2 pt-2"
              >
                {[
                  { label: "TRANG CHỦ", path: "/" },
                  { label: "BỘ SƯU TẬP", path: "/products" },
                  { label: "ƯU ĐÃI VOUCHER", path: "/vouchers" },
                  { label: "GIỎ HÀNG CỦA BẠN", path: "/cart" },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="group flex items-center justify-between border-b border-[#05251C]/10 py-3 transition-colors hover:border-[#05251C]"
                  >
                    <span className="font-condensed text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-[#05251C] transition-transform duration-300 group-hover:translate-x-2">
                      {item.label}
                    </span>
                    <ArrowUpRight
                      size={20}
                      className="opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1"
                    />
                  </Link>
                ))}
              </nav>
            </div>

            {/* Atelier Contact & Address Information (~40%) */}
            <div className="lg:col-span-5 space-y-8 font-sans">
              <div className="space-y-2">
                <span className="font-condensed text-3xl font-extrabold uppercase tracking-wider text-[#05251C]">
                  {siteName}
                </span>
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#05251C]/60">
                  {footer.atelierEdition}
                </p>
                <p className="text-xs text-[#05251C]/75 leading-relaxed pt-2 max-w-sm">
                  {footer.aboutText}
                </p>
              </div>

              {/* Direct Info */}
              <div className="space-y-3 border-t border-[#05251C]/10 pt-6 font-mono text-xs text-[#05251C]/80">
                <div>
                  <span className="text-[#05251C]/50 uppercase block text-[10px] tracking-widest">
                    ĐỊA CHỈ XƯỞNG
                  </span>
                  <span className="font-semibold text-sm">{address}</span>
                </div>
                <div>
                  <span className="text-[#05251C]/50 uppercase block text-[10px] tracking-widest">
                    HOTLINE
                  </span>
                  <a
                    href={`tel:${hotline}`}
                    className="font-semibold text-sm hover:underline"
                  >
                    {hotline}
                  </a>
                </div>
                <div>
                  <span className="text-[#05251C]/50 uppercase block text-[10px] tracking-widest">
                    THƯ ĐIỆN TỬ
                  </span>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="font-semibold text-sm hover:underline"
                  >
                    {contactEmail}
                  </a>
                </div>
              </div>

              {/* Social Channels */}
              <div className="flex items-center gap-6 font-mono text-[11px] tracking-widest uppercase pt-2">
                <a
                  href={socialLinks.instagram || "https://instagram.com"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#05251C]/70 hover:text-[#05251C] hover:underline"
                >
                  Instagram
                </a>
                <span className="text-[#05251C]/20">/</span>
                <a
                  href={socialLinks.facebook || "https://facebook.com"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#05251C]/70 hover:text-[#05251C] hover:underline"
                >
                  Facebook
                </a>
                <span className="text-[#05251C]/20">/</span>
                <a
                  href={socialLinks.tiktok || "https://tiktok.com"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#05251C]/70 hover:text-[#05251C] hover:underline"
                >
                  TikTok
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Attribution */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-[#05251C]/10 pt-8 font-mono text-[11px] text-[#05251C]/50">
            <span>{copyrightText}</span>
            <span className="tracking-widest uppercase">
              DESIGNED WITH SPYKER-INSPIRED SCROLLYTELLING
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewsletterFooterSection;
