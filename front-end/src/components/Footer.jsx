import React from "react";
import { MdEmail, MdPhone, MdLocationOn } from "react-icons/md";
import { FaFacebook,FaInstagram, FaTiktok   } from "react-icons/fa";
import { Link } from "react-router-dom";
const Footer = () => {
  return (
    <div className="flex-col h-auto min-w-min bg-gray-800 text-white px-5">
      <div className="flex gap-10 justify-between items-start py-3">
        <ul>
          <li className="hover:underline"><Link to="/about">Giới thiệu</Link></li>
          <li className="hover:underline"><Link to="/contact">Liên hệ</Link></li>
          <li className="hover:underline"><Link to="/policy">Chính sách</Link></li>
          <li className="hover:underline"><Link to="/terms">Điều khoản</Link></li>
        </ul>
        <ul>
          <li className="flex items-center gap-2 hover:underline"><FaFacebook /> Facebook</li>
          <li className="flex items-center gap-2 hover:underline"><FaInstagram /> Instagram</li>
          <li className="flex items-center gap-2 hover:underline"><FaTiktok  /> TikTok</li>
        </ul>
        <ul>
          <li className="flex items-center gap-2 hover:underline"><MdEmail /> info@404studio.com</li>
          <li className="flex items-center gap-2 hover:underline"><MdPhone /> 0123 456 789</li>
          <li className="flex items-center gap-2 hover:underline"><MdLocationOn /> 123 Đường ABC, Quận XYZ, TP. HCM</li>
        </ul>
      </div>
        <hr />
      <div>
        <p className="text-sm text-center py-2">© 2024 404 Studio. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Footer;
