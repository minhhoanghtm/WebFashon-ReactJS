import React from "react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="w-full bg-[#08080a] border-t border-[rgba(244,240,232,0.1)] pt-16 pb-12 text-[#9a989f]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[rgba(244,240,232,0.08)]">
          {/* Brand Manifesto */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-lg font-display font-bold tracking-widest text-[#f4f0e8]">
              <span className="w-2.5 h-2.5 bg-[#e65100] inline-block" />
              <span>WEBFASHION ATELIER</span>
            </div>
            <p className="text-xs leading-relaxed max-w-sm text-[#9a989f]">
              Nền tảng thương mại điện tử may đo đương đại. Định hình phong cách qua cấu trúc phom dáng, chất liệu thượng hạng và kỹ thuật hoàn thiện thủ công.
            </p>
            <div className="pt-2 text-[11px] font-mono text-[#6b6973] space-y-1">
              <div>Showroom 01: District 1, Ho Chi Minh City</div>
              <div>Showroom 02: Hoan Kiem District, Ha Noi</div>
              <div>Liên hệ: atelier@404studio.example</div>
            </div>
          </div>

          {/* Nav: Khám Phá */}
          <div className="space-y-3">
            <h4 className="font-display text-xs tracking-wider uppercase text-[#f4f0e8]">
              Khám Phá
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/products" className="hover:text-[#f4f0e8] transition-colors">
                  Tất Cả Thiết Kế
                </Link>
              </li>
              <li>
                <Link to="/lookbooks" className="hover:text-[#f4f0e8] transition-colors">
                  Lookbooks Theo Mùa
                </Link>
              </li>
              <li>
                <Link to="/vouchers" className="hover:text-[#f4f0e8] transition-colors">
                  Đặc Quyền Vouchers
                </Link>
              </li>
              <li>
                <Link to="/order-lookup" className="hover:text-[#f4f0e8] transition-colors">
                  Tra Cứu Tiến Độ Đơn
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#f4f0e8] transition-colors">
                  Về Chúng Tôi (About)
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-[#f4f0e8] transition-colors">
                  Tạp Chí Phong Cách (Blog)
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav: Dịch Vụ & Pháp Lý */}
          <div className="space-y-3">
            <h4 className="font-display text-xs tracking-wider uppercase text-[#f4f0e8]">
              Dịch Vụ & Chính Sách
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/policy" className="hover:text-[#f4f0e8] transition-colors">
                  Tôn Chỉ Thương Hiệu
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-[#f4f0e8] transition-colors">
                  Chính Sách Vận Chuyển
                </Link>
              </li>
              <li>
                <Link to="/returns-refunds" className="hover:text-[#f4f0e8] transition-colors">
                  Quy Định Đổi Trả
                </Link>
              </li>
              <li>
                <Link to="/payment-policy" className="hover:text-[#f4f0e8] transition-colors">
                  Chính Sách Thanh Toán
                </Link>
              </li>
              <li>
                <Link to="/guide" className="hover:text-[#f4f0e8] transition-colors">
                  Hướng Dẫn Chọn Size
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#f4f0e8] transition-colors">
                  Câu Hỏi Thường Gặp
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav: Quyền Riêng Tư & Bản Quyền */}
          <div className="space-y-3">
            <h4 className="font-display text-xs tracking-wider uppercase text-[#f4f0e8]">
              Pháp Lý & Bảo Mật
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="hover:text-[#f4f0e8] transition-colors">
                  Bảo Mật Dữ Liệu
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#f4f0e8] transition-colors">
                  Điều Khoản Dịch Vụ
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-[#f4f0e8] transition-colors">
                  Chính Sách Cookies
                </Link>
              </li>
              <li>
                <Link to="/contact-legal" className="hover:text-[#f4f0e8] transition-colors">
                  Thông Tin Pháp Lý
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#6b6973]">
          <div>
            © {new Date().getFullYear()} WEBFASHION ATELIER — TẤT CẢ QUYỀN ĐƯỢC BẢO LƯU.
          </div>
          <div className="flex items-center gap-4">
            <span>MONOCHROME LUXURY</span>
            <span>•</span>
            <span>SIGNAL EDITION V2</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
