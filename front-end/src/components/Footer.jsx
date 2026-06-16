import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MdEmail, MdPhone, MdLocationOn } from "react-icons/md";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { toast } from "react-toastify";
import "./footer.css";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email không hợp lệ.");
      return;
    }
    toast.success("Đăng ký nhận tin tức thành công!");
    setEmail("");
  };

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Cột 1: Brand Info */}
          <div className="footer-section footer-brand">
            <Link to="/" className="footer-logo">
              404Studio
            </Link>
            <p className="footer-brand-desc">
              Thương hiệu thời trang cao cấp mang phong cách hiện đại, tối giản và tinh tế. Nâng tầm phong cách cá nhân của bạn mỗi ngày.
            </p>
            <div className="footer-socials">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Facebook">
                <FaFacebook />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="TikTok">
                <FaTiktok />
              </a>
            </div>
          </div>

          {/* Cột 2: Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">Khám phá</h3>
            <ul className="footer-links">
              <li className="footer-link-item">
                <Link to="/">Sản phẩm</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/vouchers">Khuyến mãi</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/about">Giới thiệu</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/policy">Chính sách</Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Contact Info */}
          <div className="footer-section">
            <h3 className="footer-title">Liên hệ</h3>
            <ul className="footer-contact-list">
              <li className="footer-contact-item">
                <MdLocationOn />
                <span>123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh</span>
              </li>
              <li className="footer-contact-item">
                <MdPhone />
                <span>0123 456 789</span>
              </li>
              <li className="footer-contact-item">
                <MdEmail />
                <span>info@404studio.com</span>
              </li>
            </ul>
          </div>

          {/* Cột 4: Newsletter */}
          <div className="footer-section footer-newsletter">
            <h3 className="footer-title">Bản tin</h3>
            <p className="footer-newsletter-desc">
              Đăng ký nhận tin tức để nhận các thông tin ưu đãi mới nhất và bộ sưu tập thời trang sắp ra mắt.
            </p>
            <form onSubmit={handleSubscribe} className="footer-newsletter-form">
              <input
                type="email"
                placeholder="Email của bạn"
                className="footer-newsletter-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email nhận bản tin"
              />
              <button type="submit" className="footer-newsletter-btn">
                Đăng ký
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-copy">
            &copy; {new Date().getFullYear()} 404Studio Store. All rights reserved.
          </div>
          <div className="footer-bottom-links">
            <Link to="/terms">Điều khoản sử dụng</Link>
            <Link to="/privacy">Chính sách bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
