import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MdEmail, MdPhone, MdLocationOn } from "react-icons/md";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { useWebsiteSettings } from "../hooks/useWebsiteSettings";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { settings } = useWebsiteSettings();

  const general = settings?.general || {};
  const socialLinks = settings?.socialLinks || {};
  const footerData = settings?.footer || {};

  const siteName = general.siteName || "404STUDIO";
  const address = general.address || "123 Đường Đồng Khởi, Quận 1, TP. Hồ Chí Minh";
  const hotline = general.hotline || "0901 234 567";
  const contactEmail = general.email || "atelier@404studio.vn";
  const copyrightText = footerData.copyrightText || `© ${new Date().getFullYear()} ${siteName} ATELIER. ALL RIGHTS RESERVED.`;

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập địa chỉ email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Địa chỉ email không hợp lệ.");
      return;
    }
    toast.success("Chào mừng bạn gia nhập cộng đồng 404Studio Atelier! ✦");
    setEmail("");
  };

  return (
    <footer className="site-footer relative bg-[#062D22] text-[#F7F6F1] pt-16 sm:pt-24 pb-10 sm:pb-12 overflow-hidden border-t border-[#041E17] selection:bg-[#F5DD20] selection:text-[#062D22]">
      {/* Decorative architectural background glow */}
      <div className="pointer-events-none absolute -top-40 right-10 w-96 h-96 rounded-full bg-[#041E17]/80 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#F5DD20]/5 blur-3xl" />

      <div className="relative mx-auto max-w-[1440px] w-full px-4 sm:px-6 lg:px-10">
        {/* Top Editorial Row: Manifesto & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-0 py-1 border-y border-white/15 text-[10px] font-bold tracking-[0.2em] text-[#F5DD20] uppercase">
              <Sparkles size={12} />
              <span>Digital Fashion Atelier 2026</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-[#F7F6F1] font-display leading-[0.92]">
              DESIGNED TO MOVE WITH YOU.<br />
              <span className="text-[#F5DD20]">WEAR YOUR STORY.</span>
            </h2>
            <p className="text-sm text-[#D1D9CF] max-w-lg leading-relaxed pt-2">
              Chúng tôi kiến tạo thời trang như một ngôn ngữ thể hiện cá tính độc bản. May đo cấu trúc đương đại giao hòa cùng tinh thần streetwear phá cách.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-end">
            <div className="bg-[#041E17]/80 border border-white/10 rounded-none p-6 sm:p-8 backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-[#F5DD20] mb-2">
                Brand Community & Newsletter
              </h3>
              <p className="text-xs text-[#D1D9CF] mb-5">
                Đăng ký để nhận sớm nhất thông báo về sàn diễn lookbook và các đợt phát hành giới hạn.
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  className="flex-1 bg-[#062D22] border border-white/15 rounded-none px-4 py-3 text-xs text-[#F7F6F1] placeholder:text-[#D1D9CF]/40 outline-none focus:border-[#F5DD20] transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-none bg-[#F5DD20] text-[#062D22] font-bold text-xs uppercase tracking-wider hover:bg-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Gia nhập</span>
                  <ArrowUpRight size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Center Grid: Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-14 border-b border-white/10">
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#F5DD20] mb-5">
              Khám phá
            </h4>
            <ul className="space-y-3 text-xs text-[#D1D9CF]">
              <li>
                <Link to="/products" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-1 transition-transform">Tất cả sản phẩm</span>
                </Link>
              </li>
              <li>
                <Link to="/lookbooks" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-1 transition-transform">Lookbook & Triển lãm</span>
                </Link>
              </li>
              <li>
                <Link to="/vouchers" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-1 transition-transform">Voucher ưu đãi</span>
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-1 transition-transform">Danh sách yêu thích</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#F5DD20] mb-5">
              Thương hiệu
            </h4>
            <ul className="space-y-3 text-xs text-[#D1D9CF]">
              <li>
                <Link to="/about" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-1 transition-transform">Câu chuyện Atelier</span>
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-1 transition-transform">Tạp chí thời trang</span>
                </Link>
              </li>
              <li>
                <Link to="/guide" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-1 transition-transform">Bảng size & Định hình phom</span>
                </Link>
              </li>
              <li>
                <Link to="/landing" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-1 transition-transform">Không gian trải nghiệm</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#F5DD20] mb-5">
              Hỗ trợ khách hàng
            </h4>
            <ul className="space-y-3 text-xs text-[#D1D9CF]">
              <li>
                <Link to="/policy" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-1 transition-transform">Chính sách đổi trả 7 ngày</span>
                </Link>
              </li>
              <li>
                <Link to="/policy" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-1 transition-transform">Vận chuyển & Giao nhận</span>
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-1 transition-transform">Câu hỏi thường gặp</span>
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-1 transition-transform">Tra cứu đơn hàng</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#F5DD20] mb-5">
              Liên hệ Atelier
            </h4>
            <div className="space-y-3 text-xs text-[#D1D9CF]">
              <p className="flex items-start gap-2">
                <MdLocationOn size={16} className="text-[#F5DD20] shrink-0 mt-0.5" />
                <span>{address}</span>
              </p>
              <p className="flex items-center gap-2">
                <MdPhone size={16} className="text-[#F5DD20] shrink-0" />
                <span>{hotline}</span>
              </p>
              <p className="flex items-center gap-2">
                <MdEmail size={16} className="text-[#F5DD20] shrink-0" />
                <span>{contactEmail}</span>
              </p>
              <div className="flex items-center gap-3 pt-3">
                <a
                  href={socialLinks.facebook || "https://facebook.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#073D2A] flex items-center justify-center text-[#F1D8CA] hover:bg-[#F5DD20] hover:text-[#05251C] transition-colors"
                  aria-label="Facebook"
                >
                  <FaFacebook size={14} />
                </a>
                <a
                  href={socialLinks.instagram || "https://instagram.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#073D2A] flex items-center justify-center text-[#F1D8CA] hover:bg-[#F5DD20] hover:text-[#05251C] transition-colors"
                  aria-label="Instagram"
                >
                  <FaInstagram size={14} />
                </a>
                <a
                  href={socialLinks.tiktok || "https://tiktok.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#073D2A] flex items-center justify-center text-[#F1D8CA] hover:bg-[#F5DD20] hover:text-[#05251C] transition-colors"
                  aria-label="TikTok"
                >
                  <FaTiktok size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* GIANT BRAND TYPOGRAPHY: NEARLY FULLSCREEN */}
        <div className="pt-12 pb-8 overflow-hidden select-none text-center">
          <span className="block font-display text-[15vw] leading-[0.78] font-black tracking-tighter text-[#F1D8CA]/10 hover:text-[#F5DD20]/25 transition-colors duration-700 cursor-default">
            {siteName}
          </span>
        </div>

        {/* Bottom Bar: Copyright & Micro Links */}
        <div className="pt-6 border-t border-[#F1D8CA]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#D1D9CF]/60 tracking-wider">
          <div>{copyrightText}</div>
          <div className="flex items-center gap-6">
            <Link to="/policy" className="hover:text-white transition-colors">Bảo mật</Link>
            <span>·</span>
            <Link to="/policy" className="hover:text-white transition-colors">Điều khoản</Link>
            <span>·</span>
            <Link to="/about" className="hover:text-white transition-colors">Về chúng tôi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
